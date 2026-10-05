package kh.toklok.controller;

import kh.toklok.exception.ResourceNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hashtags")
public class HashtagController {

    private final JdbcTemplate db;

    public HashtagController(JdbcTemplate db) {
        this.db = db;
    }

    @GetMapping("/{tag}")
    public ResponseEntity<?> getHashtagPage(@PathVariable String tag,
                                             @RequestParam(defaultValue = "1") int page,
                                             Authentication auth) {
        String tagLower = tag.toLowerCase();
        var hashtagInfo = db.queryForList("SELECT * FROM hashtags WHERE tag = ?", tagLower);
        if (hashtagInfo.isEmpty()) {
            return ResponseEntity.ok(Map.of("hashtag", Map.of("tag", tag, "post_count", 0), "posts", java.util.List.of(), "page", page));
        }

        int offset = (page - 1) * 20;
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        String sql = "SELECT p.* FROM posts p JOIN post_hashtags ph ON p.id = ph.post_id " +
            "JOIN hashtags h ON h.id = ph.hashtag_id WHERE h.tag = ? AND p.is_archived = 0";
        if (userId != null) {
            sql += " AND p.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)";
            var posts = db.queryForList(sql + " ORDER BY p.created_at DESC LIMIT 20 OFFSET ?", tagLower, userId, offset);
            return ResponseEntity.ok(Map.of("hashtag", hashtagInfo.get(0), "posts", posts, "page", page));
        }
        var posts = db.queryForList(sql + " ORDER BY p.created_at DESC LIMIT 20 OFFSET ?", tagLower, offset);
        return ResponseEntity.ok(Map.of("hashtag", hashtagInfo.get(0), "posts", posts, "page", page));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchHashtags(@RequestParam String q) {
        var results = db.queryForList(
            "SELECT * FROM hashtags WHERE tag LIKE ? ORDER BY post_count DESC LIMIT 20",
            q.toLowerCase() + "%");
        return ResponseEntity.ok(results);
    }
}
