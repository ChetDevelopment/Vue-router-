package kh.toklok.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final JdbcTemplate db;

    public SettingsController(JdbcTemplate db) {
        this.db = db;
    }

    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        var rows = db.queryForList(
            "SELECT * FROM user_preferences WHERE user_id = ?", userId);
        if (rows.isEmpty()) {
            java.util.LinkedHashMap<String, Object> defs = new java.util.LinkedHashMap<>();
            defs.put("language", "km");
            defs.put("contentLanguage", "km");
            defs.put("autoplayVideos", true);
            defs.put("saveWatchHistory", true);
            defs.put("privateAccount", false);
            defs.put("allowDuet", true);
            defs.put("allowStitch", true);
            defs.put("allowDownloads", true);
            defs.put("pushLikes", true);
            defs.put("pushComments", true);
            defs.put("pushFollows", true);
            defs.put("pushMessages", true);
            defs.put("pushLive", true);
            return ResponseEntity.ok(defs);
        }
        return ResponseEntity.ok(rows.get(0));
    }

    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(Authentication auth, @RequestBody Map<String, Object> body) {
        String userId = (String) auth.getPrincipal();
        var existing = db.queryForList("SELECT id FROM user_preferences WHERE user_id = ?", userId);

        if (existing.isEmpty()) {
            String id = UUID.randomUUID().toString();
            db.update(
                "INSERT INTO user_preferences (id, user_id, language, content_language, autoplay_videos, " +
                "save_watch_history, private_account, allow_duet, allow_stitch, allow_downloads, " +
                "push_likes, push_comments, push_follows, push_messages, push_live) " +
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                id, userId,
                body.getOrDefault("language", "km"),
                body.getOrDefault("contentLanguage", "km"),
                bool(body.get("autoplayVideos"), true),
                bool(body.get("saveWatchHistory"), true),
                bool(body.get("privateAccount"), false),
                bool(body.get("allowDuet"), true),
                bool(body.get("allowStitch"), true),
                bool(body.get("allowDownloads"), true),
                bool(body.get("pushLikes"), true),
                bool(body.get("pushComments"), true),
                bool(body.get("pushFollows"), true),
                bool(body.get("pushMessages"), true),
                bool(body.get("pushLive"), true)
            );
        } else {
            String sql = "UPDATE user_preferences SET ";
            java.util.List<String> sets = new java.util.ArrayList<>();
            java.util.List<Object> params = new java.util.ArrayList<>();
            for (var entry : body.entrySet()) {
                String col = toSnakeCase(entry.getKey());
                sets.add(col + " = ?");
                params.add(entry.getValue() instanceof Boolean ? (Boolean) entry.getValue() ? 1 : 0 : entry.getValue());
            }
            sql += String.join(", ", sets) + " WHERE user_id = ?";
            params.add(userId);
            db.update(sql, params.toArray());
        }

        var updated = db.queryForList("SELECT * FROM user_preferences WHERE user_id = ?", userId);
        return ResponseEntity.ok(updated.isEmpty() ? body : updated.get(0));
    }

    private int bool(Object val, boolean def) {
        if (val instanceof Boolean) return (Boolean) val ? 1 : 0;
        if (val instanceof Number) return ((Number) val).intValue();
        return def ? 1 : 0;
    }

    private String toSnakeCase(String camel) {
        return camel.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }
}
