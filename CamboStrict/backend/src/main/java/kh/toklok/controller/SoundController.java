package kh.toklok.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sounds")
public class SoundController {

    private final JdbcTemplate db;

    public SoundController(JdbcTemplate db) {
        this.db = db;
    }

    @GetMapping("/trending")
    public ResponseEntity<?> getTrendingSounds() {
        var sounds = db.queryForList(
            "SELECT s.*, COUNT(p.id) as usage_count FROM sound_library s " +
            "LEFT JOIN posts p ON p.sound_id = s.id AND p.is_archived = 0 " +
            "WHERE s.is_active = 1 " +
            "GROUP BY s.id ORDER BY usage_count DESC, s.created_at DESC LIMIT 20");
        return ResponseEntity.ok(sounds);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchSounds(@RequestParam String q) {
        var results = db.queryForList(
            "SELECT * FROM sound_library WHERE is_active = 1 AND (title LIKE ? OR creator_name LIKE ? OR category LIKE ?) " +
            "ORDER BY usage_count DESC, created_at DESC LIMIT 20",
            q + "%", q + "%", q + "%");
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSound(@PathVariable String id) {
        var rows = db.queryForList("SELECT * FROM sound_library WHERE id = ?", id);
        if (rows.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "id", id, "title", "Unknown Sound", "creator_name", "Original",
                "duration_seconds", 0, "category", "Original"
            ));
        }
        return ResponseEntity.ok(rows.get(0));
    }
}
