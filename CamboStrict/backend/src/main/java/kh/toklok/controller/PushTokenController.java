package kh.toklok.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/push")
public class PushTokenController {

    private static final Logger log = LoggerFactory.getLogger(PushTokenController.class);
    private final JdbcTemplate db;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public PushTokenController(JdbcTemplate db) {
        this.db = db;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerToken(Authentication auth, @RequestBody Map<String, String> body) {
        String userId = (String) auth.getPrincipal();
        String token = body.get("token");
        String platform = body.getOrDefault("platform", "ios");

        if (token == null || token.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", Map.of("code", "MISSING_TOKEN", "message", "Token required")));

        var existing = db.query("SELECT id FROM push_tokens WHERE user_id = ? AND token = ?",
            (rs, i) -> rs.getString("id"), userId, token);
        if (existing.isEmpty()) {
            db.update("INSERT INTO push_tokens (id, user_id, token, platform) VALUES (?,?,?,?)",
                UUID.randomUUID().toString(), userId, token, platform);
        } else {
            db.update("UPDATE push_tokens SET is_active = 1 WHERE id = ?", existing.get(0));
        }

        return ResponseEntity.ok(Map.of("message", "Token registered"));
    }

    @PostMapping("/unregister")
    public ResponseEntity<?> unregisterToken(Authentication auth, @RequestBody Map<String, String> body) {
        String userId = (String) auth.getPrincipal();
        String token = body.get("token");
        if (token != null) {
            db.update("UPDATE push_tokens SET is_active = 0 WHERE user_id = ? AND token = ?", userId, token);
        }
        return ResponseEntity.ok(Map.of("message", "Token unregistered"));
    }

    public void sendPush(String userId, String title, String body, Map<String, String> data) {
        var tokens = db.query("SELECT token FROM push_tokens WHERE user_id = ? AND is_active = 1",
            (rs, i) -> rs.getString("token"), userId);
        if (tokens.isEmpty()) return;

        for (String pushToken : tokens) {
            try {
                String json = String.format(
                    "{\"to\":\"%s\",\"title\":\"%s\",\"body\":\"%s\",\"data\":%s}",
                    pushToken, escape(title), escape(body),
                    data != null ? mapToJson(data) : "{}"
                );
                var request = HttpRequest.newBuilder()
                    .uri(URI.create("https://exp.host/--/api/v2/push/send"))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
                var responseFuture = httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString());
                responseFuture.whenComplete((resp, ex) -> {
                    if (ex != null) {
                        log.error("Failed to send push notification", ex);
                    } else if (resp.statusCode() >= 400) {
                        log.error("Push notification API returned {}", resp.statusCode());
                    }
                });
            } catch (Exception e) {
                log.error("Error queueing push notification", e);
            }
        }
    }

    private String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }

    private String mapToJson(Map<String, String> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (var entry : map.entrySet()) {
            if (!first) sb.append(",");
            sb.append("\"").append(escape(entry.getKey())).append("\":\"").append(escape(entry.getValue())).append("\"");
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }
}
