package kh.toklok.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Service
public class PushNotificationService {

    private final JdbcTemplate db;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public PushNotificationService(JdbcTemplate db) {
        this.db = db;
    }

    public void sendPush(String userId, String title, String body, Map<String, String> data) {
        var tokens = db.query("SELECT token FROM push_tokens WHERE user_id = ? AND is_active = 1",
            (rs, i) -> rs.getString("token"), userId);
        if (tokens.isEmpty()) return;

        for (String token : tokens) {
            try {
                Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("to", token);
                payload.put("title", title);
                payload.put("body", body);
                payload.put("data", data != null ? data : Map.of());
                payload.put("sound", "default");

                String json = mapper.writeValueAsString(payload);
                var request = HttpRequest.newBuilder()
                    .uri(URI.create("https://exp.host/--/api/v2/push/send"))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
                httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString());
            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(PushNotificationService.class)
                    .error("Failed to send push notification to token {}", token, e);
            }
        }
    }
}
