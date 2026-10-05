package kh.toklok.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class NotificationRepository extends BaseRepository {

    public NotificationRepository(JdbcTemplate db) { super(db); }

    public List<Map<String, Object>> findByUserId(String userId) {
        return query("SELECT n.*, u.username as actor_username, u.avatar_url as actor_avatar " +
            "FROM notifications n JOIN users u ON n.actor_id = u.id WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 50", userId);
    }

    public void markRead(String notificationId, String userId) {
        update("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", notificationId, userId);
    }

    public void markAllRead(String userId) {
        update("UPDATE notifications SET is_read = 1 WHERE user_id = ?", userId);
    }

    public long countUnread(String userId) {
        return queryObject("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0", Long.class, userId);
    }

    public String create(String userId, String actorId, String type, String targetId, String message) {
        String id = UUID.randomUUID().toString();
        update("INSERT INTO notifications (id, user_id, actor_id, type, target_id, message) VALUES (?,?,?,?,?,?)",
            id, userId, actorId, type, targetId, message);
        return id;
    }
}
