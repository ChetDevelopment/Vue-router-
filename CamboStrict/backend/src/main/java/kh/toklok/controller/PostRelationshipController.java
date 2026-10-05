package kh.toklok.controller;

import kh.toklok.exception.ResourceNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostRelationshipController {

    private final JdbcTemplate db;

    public PostRelationshipController(JdbcTemplate db) {
        this.db = db;
    }

    @PostMapping("/{postId}/duet")
    public ResponseEntity<?> createDuet(Authentication auth, @PathVariable String postId,
                                         @RequestBody(required = false) Map<String, Object> body) {
        String userId = (String) auth.getPrincipal();

        var post = db.queryForList("SELECT id, user_id FROM posts WHERE id = ? AND is_archived = 0", postId);
        if (post.isEmpty()) throw new ResourceNotFoundException("Post not found");

        String newPostId = (String) body.getOrDefault("postId", UUID.randomUUID().toString());

        db.update("INSERT INTO post_relationships (id, source_post_id, target_post_id, type) VALUES (?,?,?,?)",
            UUID.randomUUID().toString(), newPostId, postId, "duet");

        return ResponseEntity.ok(Map.of("message", "Duet created", "relationshipType", "duet", "originalPostId", postId));
    }

    @PostMapping("/{postId}/stitch")
    public ResponseEntity<?> createStitch(Authentication auth, @PathVariable String postId,
                                           @RequestBody(required = false) Map<String, Object> body) {
        String userId = (String) auth.getPrincipal();

        var post = db.queryForList("SELECT id FROM posts WHERE id = ? AND is_archived = 0", postId);
        if (post.isEmpty()) throw new ResourceNotFoundException("Post not found");

        String newPostId = (String) body.getOrDefault("postId", UUID.randomUUID().toString());

        db.update("INSERT INTO post_relationships (id, source_post_id, target_post_id, type) VALUES (?,?,?,?)",
            UUID.randomUUID().toString(), newPostId, postId, "stitch");

        return ResponseEntity.ok(Map.of("message", "Stitch created", "relationshipType", "stitch", "originalPostId", postId));
    }

    @PostMapping("/{postId}/repost")
    public ResponseEntity<?> createRepost(Authentication auth, @PathVariable String postId) {
        String userId = (String) auth.getPrincipal();

        var post = db.queryForList("SELECT id FROM posts WHERE id = ? AND is_archived = 0", postId);
        if (post.isEmpty()) throw new ResourceNotFoundException("Post not found");

        // Check if already reposted (using user_id column instead of source_post_id for non-post relationships)
        var existing = db.queryForList("SELECT id FROM post_relationships WHERE user_id = ? AND target_post_id = ? AND type = 'repost'",
            userId, postId);
        if (!existing.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "Already reposted", "reposted", true));
        }

        // source_post_id uses the original post ID to satisfy FK, user_id tracks who reposted
        db.update("INSERT INTO post_relationships (id, source_post_id, target_post_id, user_id, type) VALUES (?,?,?,?,?)",
            UUID.randomUUID().toString(), postId, postId, userId, "repost");

        db.update("UPDATE posts SET share_count = share_count + 1 WHERE id = ?", postId);

        return ResponseEntity.ok(Map.of("message", "Reposted", "reposted", true));
    }

    @DeleteMapping("/{postId}/repost")
    public ResponseEntity<?> removeRepost(Authentication auth, @PathVariable String postId) {
        String userId = (String) auth.getPrincipal();
        db.update("DELETE FROM post_relationships WHERE user_id = ? AND target_post_id = ? AND type = 'repost'",
            userId, postId);
        db.update("UPDATE posts SET share_count = GREATEST(0, share_count - 1) WHERE id = ?", postId);
        return ResponseEntity.ok(Map.of("message", "Repost removed", "reposted", false));
    }

    @GetMapping("/{postId}/relationships")
    public ResponseEntity<?> getRelationships(@PathVariable String postId) {
        var duets = db.queryForList(
            "SELECT pr.*, p.username, p.caption, p.media_urls, p.cover_thumbnail_url, p.created_at " +
            "FROM post_relationships pr JOIN posts p ON pr.source_post_id = p.id " +
            "WHERE pr.target_post_id = ? AND p.is_archived = 0 ORDER BY pr.created_at DESC LIMIT 50", postId);
        var original = db.queryForList(
            "SELECT pr.*, p.username, p.caption, p.media_urls, p.cover_thumbnail_url, p.created_at " +
            "FROM post_relationships pr JOIN posts p ON pr.target_post_id = p.id " +
            "WHERE pr.source_post_id = ? AND p.is_archived = 0 LIMIT 1", postId);

        return ResponseEntity.ok(Map.of(
            "duets", duets,
            "original", original.isEmpty() ? null : original.get(0)
        ));
    }
}
