package kh.toklok.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class CommentRepository extends BaseRepository {

    public CommentRepository(JdbcTemplate db) { super(db); }

    public List<Map<String, Object>> findByPostId(String postId, String excludeUserId) {
        String sql = "SELECT c.*, u.username, u.avatar_url as user_avatar, u.display_name as user_display_name " +
            "FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ?";
        if (excludeUserId != null) {
            sql += " AND c.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)";
            return query(sql + " ORDER BY c.created_at ASC", postId, excludeUserId);
        }
        return query(sql + " ORDER BY c.created_at ASC", postId);
    }

    public Map<String, Object> findById(String id) {
        var rows = query(
            "SELECT c.*, u.username, u.avatar_url as user_avatar, u.display_name as user_display_name " +
            "FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?", id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public String add(String postId, String userId, String content, String parentCommentId) {
        String id = UUID.randomUUID().toString();
        update("INSERT INTO comments (id, post_id, user_id, content, parent_comment_id) VALUES (?,?,?,?,?)",
            id, postId, userId, content, parentCommentId);
        update("UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?", postId);
        return id;
    }

    public void delete(String id, String postId) {
        update("DELETE FROM comments WHERE id = ?", id);
        update("UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = ?", postId);
    }

    public boolean isLikedByUser(String userId, String commentId) {
        var rows = query("SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?", userId, commentId);
        return !rows.isEmpty();
    }

    public void addLike(String userId, String commentId) {
        var existing = query("SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?", userId, commentId);
        if (existing.isEmpty()) {
            update("INSERT INTO comment_likes (id, user_id, comment_id) VALUES (?,?,?)", UUID.randomUUID().toString(), userId, commentId);
            update("UPDATE comments SET like_count = like_count + 1 WHERE id = ?", commentId);
        }
    }

    public void removeLike(String userId, String commentId) {
        update("DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?", userId, commentId);
        update("UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = ?", commentId);
    }
}
