package kh.toklok.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public class PostRepository extends BaseRepository {

    public PostRepository(JdbcTemplate db) { super(db); }

    public List<Map<String, Object>> findAll(int page, int limit, String currentUserId) {
        int offset = (page - 1) * limit;
        String sql = "SELECT * FROM posts WHERE is_archived = 0";
        sql += " AND (user_id IN (SELECT id FROM users WHERE is_private = 0 AND status = 'active')"; // public active users
        if (currentUserId != null) {
            sql += " OR user_id IN (SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted')"; // followed private users
            sql += " OR user_id = ?"; // own posts
            sql += ")"; // close the visibility parens
            sql += " AND user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)"; // blocked exclusion — applies to all conditions
            return query(sql + " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?", currentUserId, currentUserId, currentUserId, limit, offset);
        }
        sql += ") ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?";
        return query(sql, limit, offset);
    }

    public long countSmartFeed(String userId, List<Map<String, Object>> following) {
        if (!following.isEmpty()) {
            return queryObject("SELECT COUNT(*) FROM posts p WHERE p.is_archived = 0 " +
                "AND p.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)",
                Long.class, userId);
        }
        return count(userId);
    }

    public long count(String excludeUserId) {
        String sql = "SELECT COUNT(*) FROM posts WHERE is_archived = 0";
        if (excludeUserId != null) {
            sql += " AND user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)";
            return queryObject(sql, Long.class, excludeUserId);
        }
        return queryObject(sql, Long.class);
    }

    public List<Map<String, Object>> findByUserId(String userId, int page, int limit, String currentUserId) {
        int offset = (page - 1) * limit;
        String sql = "SELECT * FROM posts WHERE user_id = ? AND is_archived = 0";
        if (currentUserId != null && !currentUserId.equals(userId)) {
            sql += " AND user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)";
            return query(sql + " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?", userId, currentUserId, limit, offset);
        }
        return query(sql + " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?", userId, limit, offset);
    }

    public long countByUserId(String userId) {
        return queryObject("SELECT COUNT(*) FROM posts WHERE user_id = ? AND is_archived = 0", Long.class, userId);
    }

    public List<Map<String, Object>> getFollowingFeed(String userId, int page, int limit) {
        int offset = (page - 1) * limit;
        return query(
            "SELECT p.* FROM posts p " +
            "JOIN follows f ON p.user_id = f.following_id AND f.follower_id = ? AND f.status = 'accepted' " +
            "WHERE p.is_archived = 0 " +
            "AND p.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?) " +
            "ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?",
            userId, userId, limit, offset);
    }

    public long countFollowing(String userId) {
        return queryObject(
            "SELECT COUNT(*) FROM posts p " +
            "JOIN follows f ON p.user_id = f.following_id AND f.follower_id = ? AND f.status = 'accepted' " +
            "WHERE p.is_archived = 0 " +
            "AND p.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)",
            Long.class, userId, userId);
    }

    public Map<String, Object> findById(String id, String currentUserId) {
        var rows = query("SELECT * FROM posts WHERE id = ?", id);
        if (rows.isEmpty()) return null;
        var post = rows.get(0);
        // Only return archived posts to the owner or admins/moderators
        Object archived = post.get("is_archived");
        if (archived != null && (archived instanceof Boolean ? (Boolean) archived : ((Number) archived).intValue() == 1)) {
            String postUserId = (String) post.get("user_id");
            if (currentUserId == null || (!currentUserId.equals(postUserId) && !isAdminOrMod(currentUserId))) {
                return null;
            }
        }
        return post;
    }

    private boolean isAdminOrMod(String userId) {
        var users = query("SELECT role FROM users WHERE id = ?", userId);
        if (users.isEmpty()) return false;
        String role = (String) users.get(0).get("role");
        return "admin".equals(role) || "moderator".equals(role);
    }

    public void incrementViews(String id) {
        update("UPDATE posts SET view_count = view_count + 1 WHERE id = ?", id);
    }

    public String create(Map<String, Object> fields) {
        String id = UUID.randomUUID().toString();
        fields.put("id", id);
        StringBuilder cols = new StringBuilder();
        StringBuilder vals = new StringBuilder();
        Object[] params = new Object[fields.size()];
        int i = 0;
        for (var entry : fields.entrySet()) {
            if (i > 0) { cols.append(", "); vals.append(", "); }
            cols.append(entry.getKey());
            vals.append("?");
            params[i++] = entry.getValue();
        }
        update("INSERT INTO posts (" + cols + ") VALUES (" + vals + ")", params);
        return id;
    }

    private static final java.util.Set<String> ALLOWED_POST_FIELDS = java.util.Set.of(
        "caption", "location_tag", "visibility", "comments_enabled",
        "is_archived", "type", "sound_id", "sound_name", "sound_creator"
    );

    public void updateField(String id, String field, Object value) {
        if (!ALLOWED_POST_FIELDS.contains(field)) {
            throw new IllegalArgumentException("Invalid field: " + field);
        }
        update("UPDATE posts SET " + field + " = ? WHERE id = ?", value, id);
    }

    public void delete(String id) {
        update("DELETE FROM posts WHERE id = ?", id);
    }

    public List<Map<String, Object>> search(String q, String excludeUserId) {
        // Phase 1: Full-text search with relevance ranking
        // Falls back to LIKE if FULLTEXT returns nothing
        String sql = "SELECT p.*, MATCH(p.caption, p.location_tag, p.username) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance " +
            "FROM posts p WHERE p.is_archived = 0 AND p.user_id IN (SELECT id FROM users WHERE status = 'active')";
        if (excludeUserId != null) {
            sql += " AND p.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)";
            try {
                return query(sql + " AND MATCH(p.caption, p.location_tag, p.username) AGAINST(? IN NATURAL LANGUAGE MODE) " +
                    "ORDER BY relevance DESC LIMIT 20", q, excludeUserId, q);
            } catch (Exception e) {
                // Fallback to LIKE if FULLTEXT fails (e.g. query too short)
                return query("SELECT * FROM posts WHERE is_archived = 0 AND user_id IN (SELECT id FROM users WHERE status = 'active')" +
                    " AND (caption LIKE ? OR location_tag LIKE ? OR username LIKE ?)" +
                    " AND user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)" +
                    " ORDER BY created_at DESC LIMIT 20",
                    "%" + q + "%", "%" + q + "%", q + "%", excludeUserId);
            }
        }
        try {
            return query(sql + " AND MATCH(p.caption, p.location_tag, p.username) AGAINST(? IN NATURAL LANGUAGE MODE) " +
                "ORDER BY relevance DESC LIMIT 20", q, q);
        } catch (Exception e) {
            return query("SELECT * FROM posts WHERE is_archived = 0 AND user_id IN (SELECT id FROM users WHERE status = 'active')" +
                " AND (caption LIKE ? OR location_tag LIKE ? OR username LIKE ?)" +
                " ORDER BY created_at DESC LIMIT 20",
                "%" + q + "%", "%" + q + "%", q + "%");
        }
    }

    public List<Map<String, Object>> getBookmarked(String userId) {
        return query("SELECT p.* FROM posts p JOIN bookmarks b ON p.id = b.post_id WHERE b.user_id = ? AND p.is_archived = 0 ORDER BY b.created_at DESC", userId);
    }

    public boolean isLiked(String userId, String postId) {
        var rows = query("SELECT id FROM likes WHERE user_id = ? AND post_id = ?", userId, postId);
        return !rows.isEmpty();
    }

    public boolean isBookmarked(String userId, String postId) {
        var rows = query("SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?", userId, postId);
        return !rows.isEmpty();
    }

    public java.util.Set<String> batchIsLiked(String userId, java.util.List<String> postIds) {
        if (postIds.isEmpty()) return java.util.Collections.emptySet();
        String placeholders = String.join(",", java.util.Collections.nCopies(postIds.size(), "?"));
        Object[] params = new Object[postIds.size() + 1];
        params[0] = userId;
        for (int i = 0; i < postIds.size(); i++) params[i + 1] = postIds.get(i);
        var rows = query("SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (" + placeholders + ")", params);
        java.util.Set<String> liked = new java.util.HashSet<>();
        for (var row : rows) liked.add((String) row.get("post_id"));
        return liked;
    }

    public java.util.Set<String> batchIsBookmarked(String userId, java.util.List<String> postIds) {
        if (postIds.isEmpty()) return java.util.Collections.emptySet();
        String placeholders = String.join(",", java.util.Collections.nCopies(postIds.size(), "?"));
        Object[] params = new Object[postIds.size() + 1];
        params[0] = userId;
        for (int i = 0; i < postIds.size(); i++) params[i + 1] = postIds.get(i);
        var rows = query("SELECT post_id FROM bookmarks WHERE user_id = ? AND post_id IN (" + placeholders + ")", params);
        java.util.Set<String> bookmarked = new java.util.HashSet<>();
        for (var row : rows) bookmarked.add((String) row.get("post_id"));
        return bookmarked;
    }

    public void addLike(String userId, String postId) {
        update("INSERT INTO likes (id, user_id, post_id) VALUES (?,?,?)", UUID.randomUUID().toString(), userId, postId);
        update("UPDATE posts SET like_count = like_count + 1 WHERE id = ?", postId);
    }

    public void removeLike(String userId, String postId) {
        update("DELETE FROM likes WHERE user_id = ? AND post_id = ?", userId, postId);
        update("UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = ?", postId);
    }

    public void addBookmark(String userId, String postId) {
        var existing = query("SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?", userId, postId);
        if (existing.isEmpty()) {
            update("INSERT INTO bookmarks (id, user_id, post_id) VALUES (?,?,?)", UUID.randomUUID().toString(), userId, postId);
        }
    }

    public void removeBookmark(String userId, String postId) {
        update("DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?", userId, postId);
    }

    public List<Map<String, Object>> getTrendingHashtags() {
        return query("SELECT id, tag, post_count FROM hashtags ORDER BY post_count DESC LIMIT 20");
    }

    public List<Map<String, Object>> getAnalytics(String userId) {
        return query(
            "SELECT DATE(created_at) as date, COUNT(*) as posts, SUM(view_count) as total_views, " +
            "SUM(like_count) as total_likes, SUM(comment_count) as total_comments " +
            "FROM posts WHERE user_id = ? GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30", userId);
    }

    public List<Map<String, Object>> findByUserId(String userId, int page, int limit) {
        int offset = (page - 1) * limit;
        return query("SELECT * FROM posts WHERE user_id = ? AND is_archived = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?", userId, limit, offset);
    }

    public List<Map<String, Object>> findNearby(double lat, double lng, double radiusKm, String excludeUserId) {
        // Approximate distance: 1 degree lat ≈ 111km, 1 degree lng ≈ 111*cos(lat) km
        double latDelta = radiusKm / 111.0;
        double lngDelta = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));
        String sql = "SELECT * FROM posts WHERE is_archived = 0" +
            " AND latitude IS NOT NULL AND longitude IS NOT NULL" +
            " AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?";
        if (excludeUserId != null) {
            sql += " AND user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)";
            return query(sql + " ORDER BY created_at DESC LIMIT 50",
                lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta, excludeUserId);
        }
        return query(sql + " ORDER BY created_at DESC LIMIT 50",
            lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta);
    }
}
