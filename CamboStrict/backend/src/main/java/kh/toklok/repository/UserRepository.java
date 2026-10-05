package kh.toklok.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class UserRepository extends BaseRepository {

    public UserRepository(JdbcTemplate db) { super(db); }

    public Map<String, Object> findById(String id) {
        return queryOne(
            "SELECT id, username, display_name, email, phone, avatar_url, bio, link, " +
            "is_private, is_creator, is_verified, role, status, " +
            "follower_count, following_count, total_likes_received, created_at " +
            "FROM users WHERE id = ?", id);
    }

    public List<Map<String, Object>> findByLogin(String login) {
        return query(
            "SELECT id, username, display_name, email, phone, avatar_url, bio, link, password, " +
            "is_private, is_creator, is_verified, role, status, " +
            "follower_count, following_count, total_likes_received, created_at " +
            "FROM users WHERE email = ? OR username = ?", login, login);
    }

    public boolean existsByUsername(String username) {
        var rows = query("SELECT id FROM users WHERE username = ?", username.toLowerCase());
        return !rows.isEmpty();
    }

    public String create(String username, String displayName, String email, String phone, String encodedPassword, String avatarUrl, String bio) {
        String id = UUID.randomUUID().toString();
        update("INSERT INTO users (id, username, display_name, email, phone, password, avatar_url, bio) VALUES (?,?,?,?,?,?,?,?)",
            id, username.toLowerCase(), displayName, email, phone, encodedPassword, avatarUrl, bio);
        return id;
    }

    private static final java.util.Set<String> ALLOWED_UPDATE_COLUMNS = java.util.Set.of(
        "display_name", "bio", "link", "avatar_url", "phone", "is_private", "is_creator"
    );

    public void updateFields(String userId, Map<String, Object> fields) {
        if (fields.isEmpty()) return;
        StringBuilder sql = new StringBuilder("UPDATE users SET ");
        java.util.List<Object> params = new java.util.ArrayList<>();
        int i = 0;
        for (var entry : fields.entrySet()) {
            if (!ALLOWED_UPDATE_COLUMNS.contains(entry.getKey())) continue;
            if (i > 0) sql.append(", ");
            sql.append(entry.getKey()).append(" = ?");
            params.add(entry.getValue());
            i++;
        }
        if (params.isEmpty()) return;
        params.add(userId);
        sql.append(" WHERE id = ?");
        update(sql.toString(), params.toArray());
    }

    public List<Map<String, Object>> searchUsers(String q, String excludeUserId) {
        String sql = "SELECT id, username, display_name, avatar_url, bio, is_verified, follower_count, " +
            "MATCH(username, display_name, bio) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance " +
            "FROM users WHERE status = 'active'";
        if (excludeUserId != null) {
            sql += " AND id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)";
            try {
                return db.queryForList(sql + " AND MATCH(username, display_name, bio) AGAINST(? IN NATURAL LANGUAGE MODE) " +
                    "ORDER BY relevance DESC LIMIT 20", q, excludeUserId, q);
            } catch (Exception e) {
                return db.queryForList("SELECT id, username, display_name, avatar_url, bio, is_verified, follower_count " +
                    "FROM users WHERE status = 'active' AND id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?) " +
                    "AND (username LIKE ? OR display_name LIKE ?) LIMIT 20",
                    excludeUserId, q + "%", "%" + q + "%");
            }
        }
        try {
            return db.queryForList(sql + " AND MATCH(username, display_name, bio) AGAINST(? IN NATURAL LANGUAGE MODE) " +
                "ORDER BY relevance DESC LIMIT 20", q, q);
        } catch (Exception e) {
            return db.queryForList("SELECT id, username, display_name, avatar_url, bio, is_verified, follower_count " +
                "FROM users WHERE status = 'active' AND (username LIKE ? OR display_name LIKE ?) LIMIT 20",
                q + "%", "%" + q + "%");
        }
    }

    public List<Map<String, Object>> getFollowers(String userId) {
        return db.queryForList("SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_verified, u.follower_count " +
            "FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.following_id = ? AND f.status = 'accepted' AND u.status = 'active' " +
            "AND u.id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?) ORDER BY f.created_at DESC",
            userId, userId);
    }

    public List<Map<String, Object>> getFollowing(String userId) {
        return db.queryForList("SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_verified, u.follower_count " +
            "FROM follows f JOIN users u ON u.id = f.following_id WHERE f.follower_id = ? AND f.status = 'accepted' AND u.status = 'active' " +
            "AND u.id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?) ORDER BY f.created_at DESC",
            userId, userId);
    }

    public boolean isFollowing(String followerId, String followingId) {
        var rows = query("SELECT id FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'accepted'", followerId, followingId);
        return !rows.isEmpty();
    }

    public java.util.Set<String> batchIsFollowing(String followerId, java.util.List<String> userIds) {
        if (userIds.isEmpty()) return java.util.Collections.emptySet();
        String placeholders = String.join(",", java.util.Collections.nCopies(userIds.size(), "?"));
        Object[] params = new Object[userIds.size() + 1];
        params[0] = followerId;
        for (int i = 0; i < userIds.size(); i++) params[i + 1] = userIds.get(i);
        var rows = query("SELECT following_id FROM follows WHERE follower_id = ? AND following_id IN (" + placeholders + ") AND status = 'accepted'", params);
        java.util.Set<String> following = new java.util.HashSet<>();
        for (var row : rows) following.add((String) row.get("following_id"));
        return following;
    }

    public boolean isBlocked(String blockerId, String blockedId) {
        var rows = query("SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?", blockerId, blockedId);
        return !rows.isEmpty();
    }
}
