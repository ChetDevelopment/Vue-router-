package kh.toklok.service;

import kh.toklok.repository.PostRepository;
import kh.toklok.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private static final Logger log = LoggerFactory.getLogger(SearchService.class);

    private final PostRepository postRepo;
    private final UserRepository userRepo;
    private final JdbcTemplate db;

    // Phase 2: Tunable ranking weights — adjust these constants to tune search results
    private static final double WEIGHT_TEXT_RELEVANCE = 1.0;
    private static final double WEIGHT_ENGAGEMENT = 0.3;
    private static final double WEIGHT_RECENCY = 0.2;
    private static final double WEIGHT_FOLLOWED = 0.15;
    private static final int RECENCY_DAYS = 30;

    public SearchService(PostRepository postRepo, UserRepository userRepo, JdbcTemplate db) {
        this.postRepo = postRepo;
        this.userRepo = userRepo;
        this.db = db;
    }

    public Map<String, Object> searchAll(String q, String currentUserId, int page) {
        long start = System.currentTimeMillis();

        // Phase 1: Full-text search across posts, users, hashtags
        var posts = searchPosts(q, currentUserId);
        var users = userRepo.searchUsers(q, currentUserId);
        var hashtags = searchHashtags(q);
        var sounds = searchSounds(q);

        // Log the search query
        logSearch(q, currentUserId);

        long elapsed = System.currentTimeMillis() - start;

        return Map.of(
            "query", q,
            "posts", posts,
            "users", users,
            "hashtags", hashtags,
            "sounds", sounds,
            "totalResults", posts.size() + users.size() + hashtags.size() + sounds.size(),
            "elapsedMs", elapsed,
            "page", page
        );
    }

    public void logSearch(String query, String userId) {
        try {
            String id = UUID.randomUUID().toString();
            String sql = "INSERT INTO search_history (id, user_id, query, created_at) VALUES (?, ?, ?, ?)";
            db.update(sql, id, userId, query, java.sql.Timestamp.from(Instant.now()));

            // Upsert into trending_searches
            db.update(
                "INSERT INTO trending_searches (id, term, search_count, last_searched_at) VALUES (?, ?, 1, NOW()) " +
                "ON DUPLICATE KEY UPDATE search_count = search_count + 1, last_searched_at = NOW()",
                UUID.randomUUID().toString(), query);
        } catch (Exception e) {
            log.error("Failed to log search query: {}", query, e);
        }
    }

    public List<Map<String, Object>> getSearchHistory(String userId, int limit) {
        try {
            return db.queryForList(
                "SELECT id, query, search_type, result_count, created_at FROM search_history " +
                "WHERE user_id = ? ORDER BY created_at DESC LIMIT ?", userId, limit);
        } catch (Exception e) {
            log.error("Failed to get search history for user: {}", userId, e);
            return List.of();
        }
    }

    public List<Map<String, Object>> getTrendingSearches(int limit) {
        try {
            return db.queryForList(
                "SELECT term, search_count, category FROM trending_searches " +
                "ORDER BY search_count DESC LIMIT ?", limit);
        } catch (Exception e) {
            log.error("Failed to get trending searches", e);
            return List.of();
        }
    }

    public void logSearchClick(String searchHistoryId, String resultId, String resultType) {
        try {
            db.update("UPDATE search_history SET clicked_result_id = ?, clicked_type = ? WHERE id = ?",
                resultId, resultType, searchHistoryId);
        } catch (Exception e) {
            log.error("Failed to log search click for history: {}", searchHistoryId, e);
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> searchPosts(String q, String currentUserId) {
        var rows = postRepo.search(q, currentUserId);
        if (rows.isEmpty()) return rows;

        // Phase 2: Apply ranking (only if we have enough results to rank)
        if (rows.size() > 1) {
            long now = System.currentTimeMillis();
            
            // Collect followed user IDs for scoring boost
            Set<String> followedIds = new HashSet<>();
            if (currentUserId != null) {
                try {
                    var following = db.queryForList(
                        "SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted'", currentUserId);
                    for (var f : following) followedIds.add((String) f.get("following_id"));
                } catch (Exception ignored) {}
            }

            rows.sort((a, b) -> {
                double scoreA = calculateScore(a, now, followedIds);
                double scoreB = calculateScore(b, now, followedIds);
                return Double.compare(scoreB, scoreA);
            });
        }

        // Limit to 20 results
        return rows.size() > 20 ? rows.subList(0, 20) : rows;
    }

    private double calculateScore(Map<String, Object> post, long now, Set<String> followedIds) {
        Object relObj = post.get("relevance");
        double textScore = 0;
        if (relObj instanceof Number) textScore = ((Number) relObj).doubleValue();
        if (textScore == 0) textScore = 0.1; // Small base score for LIKE fallback results

        int likes = toInt(post.get("like_count"));
        int comments = toInt(post.get("comment_count"));
        int views = toInt(post.get("view_count"));
        double engagement = Math.log(1 + likes + comments * 2 + views * 0.5);

        double recency = 0;
        try {
            Object createdAt = post.get("created_at");
            if (createdAt != null) {
                long postTime = java.sql.Timestamp.valueOf(createdAt.toString().replace("T", " ").replace("Z", "")).getTime();
                double ageHours = (now - postTime) / 3600000.0;
                recency = Math.max(0, 1 - (ageHours / (RECENCY_DAYS * 24)));
            }
        } catch (Exception ignored) {}

        double followBoost = 0;
        String userId = (String) post.get("user_id");
        if (userId != null && followedIds.contains(userId)) followBoost = 1;

        return textScore * WEIGHT_TEXT_RELEVANCE
             + engagement * WEIGHT_ENGAGEMENT
             + recency * WEIGHT_RECENCY
             + followBoost * WEIGHT_FOLLOWED;
    }

    private List<Map<String, Object>> searchHashtags(String q) {
        try {
            return db.queryForList(
                "SELECT * FROM hashtags WHERE tag LIKE ? ORDER BY post_count DESC LIMIT 10",
                q.toLowerCase() + "%");
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<Map<String, Object>> searchSounds(String q) {
        try {
            return db.queryForList(
                "SELECT * FROM sound_library WHERE is_active = 1 AND (title LIKE ? OR creator_name LIKE ? OR category LIKE ?) " +
                "ORDER BY usage_count DESC, created_at DESC LIMIT 10",
                q + "%", q + "%", q + "%");
        } catch (Exception e) {
            return List.of();
        }
    }

    private int toInt(Object val) {
        if (val instanceof Number) return ((Number) val).intValue();
        return 0;
    }
}
