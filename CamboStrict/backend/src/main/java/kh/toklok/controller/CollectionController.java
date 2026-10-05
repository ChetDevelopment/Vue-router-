package kh.toklok.controller;

import kh.toklok.dto.AddToCollectionRequest;
import kh.toklok.dto.CreateCollectionRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    private final JdbcTemplate db;

    public CollectionController(JdbcTemplate db) {
        this.db = db;
    }

    @GetMapping
    public ResponseEntity<?> getCollections(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        var collections = db.queryForList(
            "SELECT c.*, (SELECT COUNT(*) FROM collection_posts WHERE collection_id = c.id) as post_count " +
            "FROM collections c WHERE c.user_id = ? ORDER BY c.created_at DESC", userId);
        return ResponseEntity.ok(collections);
    }

    @PostMapping
    public ResponseEntity<?> createCollection(Authentication auth, @Valid @RequestBody CreateCollectionRequest req) {
        String userId = (String) auth.getPrincipal();
        String id = UUID.randomUUID().toString();
        String emoji = req.emoji != null ? req.emoji : "\uD83D\uDCC1";
        db.update("INSERT INTO collections (id, user_id, name, emoji) VALUES (?,?,?,?)", id, userId, req.name, emoji);
        var created = db.queryForMap("SELECT * FROM collections WHERE id = ?", id);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/{id}/posts")
    public ResponseEntity<?> addToCollection(Authentication auth, @PathVariable String id,
                                              @Valid @RequestBody AddToCollectionRequest req) {
        String userId = (String) auth.getPrincipal();
        var col = db.queryForList("SELECT id FROM collections WHERE id = ? AND user_id = ?", id, userId);
        if (col.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Collection not found"));
        var existing = db.queryForList("SELECT id FROM collection_posts WHERE collection_id = ? AND post_id = ?", id, req.postId);
        if (existing.isEmpty()) {
            db.update("INSERT INTO collection_posts (id, collection_id, post_id) VALUES (?,?,?)",
                UUID.randomUUID().toString(), id, req.postId);
        }
        return ResponseEntity.ok(Map.of("message", "Post added to collection"));
    }

    @DeleteMapping("/{id}/posts/{postId}")
    public ResponseEntity<?> removeFromCollection(Authentication auth, @PathVariable String id, @PathVariable String postId) {
        String userId = (String) auth.getPrincipal();
        db.update("DELETE FROM collection_posts WHERE collection_id = ? AND post_id = ? AND collection_id IN (SELECT id FROM collections WHERE user_id = ?)",
            id, postId, userId);
        return ResponseEntity.ok(Map.of("message", "Post removed from collection"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCollectionPosts(@PathVariable String id, Authentication auth) {
        String userId = (String) auth.getPrincipal();
        var col = db.queryForList("SELECT id FROM collections WHERE id = ? AND user_id = ?", id, userId);
        if (col.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Collection not found"));
        var posts = db.queryForList(
            "SELECT p.* FROM posts p JOIN collection_posts cp ON p.id = cp.post_id WHERE cp.collection_id = ? ORDER BY cp.created_at DESC",
            id);
        return ResponseEntity.ok(posts);
    }
}
