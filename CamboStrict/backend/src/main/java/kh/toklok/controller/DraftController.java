package kh.toklok.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/drafts")
public class DraftController {

    private final JdbcTemplate db;

    public DraftController(JdbcTemplate db) {
        this.db = db;
    }

    @GetMapping
    public ResponseEntity<?> getDrafts(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        var drafts = db.queryForList(
            "SELECT * FROM drafts WHERE user_id = ? ORDER BY updated_at DESC", userId);
        return ResponseEntity.ok(drafts);
    }

    @PostMapping
    public ResponseEntity<?> saveDraft(Authentication auth, @RequestBody Map<String, Object> body) {
        String userId = (String) auth.getPrincipal();
        String id = UUID.randomUUID().toString();

        db.update("INSERT INTO drafts (id, user_id, caption, location_tag, visibility, comments_enabled, " +
            "sound_id, sound_name, sound_creator, filter_id, media_type, media_url, thumbnail_url) " +
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            id, userId,
            body.get("caption"),
            body.get("locationTag"),
            body.getOrDefault("visibility", "public"),
            body.getOrDefault("commentsEnabled", true),
            body.get("soundId"),
            body.get("soundName"),
            body.get("soundCreator"),
            body.get("filterId"),
            body.get("mediaType"),
            body.get("mediaUrl"),
            body.get("thumbnailUrl"));

        return ResponseEntity.ok(Map.of("id", id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDraft(Authentication auth, @PathVariable String id) {
        String userId = (String) auth.getPrincipal();
        db.update("DELETE FROM drafts WHERE id = ? AND user_id = ?", id, userId);
        return ResponseEntity.ok(Map.of("message", "Draft deleted"));
    }

    @DeleteMapping
    public ResponseEntity<?> clearDrafts(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        db.update("DELETE FROM drafts WHERE user_id = ?", userId);
        return ResponseEntity.ok(Map.of("message", "All drafts cleared"));
    }
}
