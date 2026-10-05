package kh.toklok.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class ReportRepository extends BaseRepository {

    public ReportRepository(JdbcTemplate db) { super(db); }

    public List<Map<String, Object>> findAll(int page, int limit, String statusFilter) {
        int offset = (page - 1) * limit;
        StringBuilder sql = new StringBuilder(
            "SELECT r.*, reporter.username as reporter_username, reporter.avatar_url as reporter_avatar " +
            "FROM reports r JOIN users reporter ON r.reporter_id = reporter.id");
        List<Object> params = new java.util.ArrayList<>();
        if (statusFilter != null && !statusFilter.isEmpty() && !"all".equals(statusFilter)) {
            sql.append(" WHERE r.status = ?");
            params.add(statusFilter);
        }
        sql.append(" ORDER BY r.created_at DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);
        return query(sql.toString(), params.toArray());
    }

    public long count(String statusFilter) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM reports");
        List<Object> params = new java.util.ArrayList<>();
        if (statusFilter != null && !statusFilter.isEmpty() && !"all".equals(statusFilter)) {
            sql.append(" WHERE status = ?");
            params.add(statusFilter);
        }
        return queryObject(sql.toString(), Long.class, params.toArray());
    }

    public Map<String, Object> findById(String id) {
        var rows = query("SELECT r.*, reporter.username as reporter_username, reporter.avatar_url as reporter_avatar " +
            "FROM reports r JOIN users reporter ON r.reporter_id = reporter.id WHERE r.id = ?", id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public String create(String reporterId, String targetType, String targetId, String reason, String targetExcerpt) {
        String id = UUID.randomUUID().toString();
        update("INSERT INTO reports (id, reporter_id, target_type, target_id, reason, target_excerpt) VALUES (?,?,?,?,?,?)",
            id, reporterId, targetType, targetId, reason, targetExcerpt);
        return id;
    }

    public void updateStatus(String id, String status) {
        update("UPDATE reports SET status = ? WHERE id = ?", status, id);
    }

    public void actionReport(String id, String status, String moderatorId) {
        update("UPDATE reports SET status = ?, moderator_id = ?, actioned_at = NOW() WHERE id = ?", status, moderatorId, id);
    }

    // DAU: count distinct users who performed an action in last 24h
    public long countDAU() {
        return queryObject(
            "SELECT COUNT(DISTINCT user_id) FROM ( " +
            "SELECT user_id FROM likes WHERE created_at >= NOW() - INTERVAL 24 HOUR " +
            "UNION SELECT user_id FROM comments WHERE created_at >= NOW() - INTERVAL 24 HOUR " +
            "UNION SELECT user_id FROM posts WHERE created_at >= NOW() - INTERVAL 24 HOUR " +
            ") active_users", Long.class);
    }

    public long countFlaggedItems() {
        return queryObject("SELECT COUNT(*) FROM reports WHERE status = 'pending'", Long.class);
    }

    public long countPublishedPosts() {
        return queryObject("SELECT COUNT(*) FROM posts WHERE is_archived = 0", Long.class);
    }
}
