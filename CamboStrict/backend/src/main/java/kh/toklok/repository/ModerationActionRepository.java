package kh.toklok.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class ModerationActionRepository extends BaseRepository {

    public ModerationActionRepository(JdbcTemplate db) { super(db); }

    public String create(String moderatorId, String targetUserId, String targetPostId,
                          String action, String reason, Integer durationHours, String reportId) {
        String id = UUID.randomUUID().toString();
        update("INSERT INTO moderation_actions (id, moderator_id, target_user_id, target_post_id, action, reason, duration_hours, report_id) VALUES (?,?,?,?,?,?,?,?)",
            id, moderatorId, targetUserId, targetPostId, action, reason, durationHours, reportId);
        return id;
    }

    public List<Map<String, Object>> findAll(int page, int limit) {
        int offset = (page - 1) * limit;
        return query(
            "SELECT ma.*, u.username as moderator_username FROM moderation_actions ma " +
            "JOIN users u ON ma.moderator_id = u.id ORDER BY ma.created_at DESC LIMIT ? OFFSET ?",
            limit, offset);
    }

    public long count() {
        return queryObject("SELECT COUNT(*) FROM moderation_actions", Long.class);
    }
}
