package kh.toklok.service;

import kh.toklok.dto.PostResponse;
import kh.toklok.exception.ForbiddenException;
import kh.toklok.util.InputSanitizer;
import kh.toklok.exception.ResourceNotFoundException;
import kh.toklok.repository.PostRepository;
import kh.toklok.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final PostRepository postRepo;
    private final UserRepository userRepo;
    private final kh.toklok.repository.NotificationRepository notificationRepo;
    private final PushNotificationService pushService;

    public PostService(PostRepository postRepo, UserRepository userRepo,
                       kh.toklok.repository.NotificationRepository notificationRepo,
                       PushNotificationService pushService) {
        this.postRepo = postRepo;
        this.userRepo = userRepo;
        this.notificationRepo = notificationRepo;
        this.pushService = pushService;
    }

    public Map<String, Object> getPosts(int page, int limit, String currentUserId) {
        var rows = postRepo.findAll(page, limit, currentUserId);
        long total = postRepo.count(currentUserId);
        if (currentUserId != null && !rows.isEmpty()) {
            return Map.of("posts", batchEnrich(rows, currentUserId), "total", total, "page", page);
        }
        return Map.of("posts", rows, "total", total, "page", page);
    }

    public Map<String, Object> getFollowingFeed(String userId, int page, int limit) {
        var rows = postRepo.getFollowingFeed(userId, page, limit);
        long total = postRepo.countFollowing(userId);
        if (!rows.isEmpty()) {
            return Map.of("posts", batchEnrich(rows, userId), "total", total, "page", page);
        }
        return Map.of("posts", rows, "total", total, "page", page);
    }

    public List<Map<String, Object>> getSmartFeed(String userId, int page, int limit) {
        int offset = (page - 1) * limit;
        String sql;
        List<Object> params = new java.util.ArrayList<>();

        var following = userRepo.query("SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted'", userId);
        if (!following.isEmpty()) {
            sql = "SELECT p.*, " +
                  "CASE WHEN p.user_id IN (" + following.stream().map(f -> "?").collect(java.util.stream.Collectors.joining(",")) + ") " +
                  "THEN 2.0 ELSE 1.0 END * " +
                  "(p.like_count + p.comment_count * 2 + p.share_count * 3) / " +
                  "GREATEST(1, POW(TIMESTAMPDIFF(HOUR, p.created_at, NOW()) + 1, 0.5)) as score " +
                  "FROM posts p WHERE p.is_archived = 0 " +
                  "AND p.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?) " +
                  "ORDER BY score DESC LIMIT ? OFFSET ?";
            for (var f : following) params.add(f.get("following_id"));
            params.add(userId);
            params.add(limit);
            params.add(offset);
        } else {
            sql = "SELECT p.*, " +
                  "(p.like_count + p.comment_count * 2 + p.share_count * 3) / " +
                  "GREATEST(1, POW(TIMESTAMPDIFF(HOUR, p.created_at, NOW()) + 1, 0.5)) as score " +
                  "FROM posts p WHERE p.is_archived = 0 " +
                  "AND p.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?) " +
                  "ORDER BY score DESC LIMIT ? OFFSET ?";
            params.add(userId);
            params.add(limit);
            params.add(offset);
        }
        var rows = userRepo.query(sql, params.toArray());
        if (userId != null && !rows.isEmpty()) {
            return batchEnrich(rows, userId);
        }
        return rows;
    }

    public PostResponse getPost(String id, String currentUserId) {
        var row = postRepo.findById(id, currentUserId);
        if (row == null) throw new ResourceNotFoundException("Post not found");
        postRepo.incrementViews(id);
        return enrich(row, currentUserId);
    }

    @Transactional
    public PostResponse createPost(String userId, String caption, String locationTag, String visibility,
                                    Boolean commentsEnabled, String soundId, String soundName, String soundCreator,
                                    String mediaUrl, String mediaType) {
        var user = userRepo.findById(userId);

        String cap = caption != null ? InputSanitizer.sanitize(caption.substring(0, Math.min(500, caption.length()))) : "";
        String loc = locationTag != null ? locationTag.substring(0, Math.min(100, locationTag.length())) : null;

        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("user_id", userId);
        fields.put("type", mediaType != null ? mediaType : "photo");
        fields.put("media_urls", "[\"" + (mediaUrl != null ? mediaUrl : "") + "\"]");
        fields.put("cover_thumbnail_url", mediaUrl);
        fields.put("caption", cap);
        fields.put("location_tag", loc);
        fields.put("visibility", visibility != null ? visibility : "public");
        fields.put("comments_enabled", commentsEnabled != null && commentsEnabled ? 1 : 0);
        fields.put("sound_id", soundId);
        fields.put("sound_name", soundName);
        fields.put("sound_creator", soundCreator);
        fields.put("username", user.get("username"));
        fields.put("user_avatar", user.get("avatar_url"));
        fields.put("user_display_name", user.get("display_name"));
        fields.put("is_user_verified", user.get("is_verified"));

        String id = postRepo.create(fields);

        // Auto-extract hashtags and @mentions from caption
        if (cap != null && !cap.isBlank()) {
            // Batch @mention lookups
            java.util.Set<String> mentionedNames = new java.util.HashSet<>();
            java.util.regex.Matcher mentionMatcher = java.util.regex.Pattern.compile("@(\\w+)").matcher(cap);
            while (mentionMatcher.find()) mentionedNames.add(mentionMatcher.group(1).toLowerCase());
            if (!mentionedNames.isEmpty()) {
                String placeholders = String.join(",", java.util.Collections.nCopies(mentionedNames.size(), "?"));
                var mentionedUsers = userRepo.query("SELECT id, username FROM users WHERE username IN (" + placeholders + ")", mentionedNames.toArray());
                for (var mu : mentionedUsers) {
                    String mentionedId = (String) mu.get("id");
                    notificationRepo.create(mentionedId, userId, "mention", id, cap.substring(0, Math.min(80, cap.length())));
                    pushService.sendPush(mentionedId, "New Mention",
                        "@" + user.get("username") + " mentioned you in a post",
                        Map.of("type", "mention", "actorId", userId, "postId", id));
                }
            }

            // Batch hashtag processing
            java.util.Set<String> tags = new java.util.HashSet<>();
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("#(\\w+)").matcher(cap);
            while (matcher.find()) tags.add(matcher.group(1).toLowerCase());
            if (!tags.isEmpty()) {
                String placeholders = String.join(",", java.util.Collections.nCopies(tags.size(), "?"));
                var existingTags = userRepo.query("SELECT id, tag FROM hashtags WHERE tag IN (" + placeholders + ")", tags.toArray());
                java.util.Map<String, String> tagMap = new java.util.HashMap<>();
                for (var et : existingTags) tagMap.put((String) et.get("tag"), (String) et.get("id"));

                for (String tag : tags) {
                    String hashtagId = tagMap.get(tag);
                    if (hashtagId == null) {
                        hashtagId = UUID.randomUUID().toString();
                        userRepo.update("INSERT INTO hashtags (id, tag, post_count) VALUES (?,?,1)", hashtagId, tag);
                    } else {
                        userRepo.update("UPDATE hashtags SET post_count = post_count + 1 WHERE id = ?", hashtagId);
                    }
                    try {
                        userRepo.update("INSERT INTO post_hashtags (id, post_id, hashtag_id) VALUES (?,?,?)",
                            UUID.randomUUID().toString(), id, hashtagId);
                    } catch (org.springframework.dao.DuplicateKeyException e) {}
                }
            }
        }

        var row = postRepo.findById(id, userId);
        return enrich(row, userId);
    }

    public PostResponse updatePost(String postId, String userId, Map<String, Object> body) {
        var row = postRepo.findById(postId, userId);
        if (row == null) throw new ResourceNotFoundException("Post not found");

        if (body.containsKey("caption")) {
            String cap = (String) body.get("caption");
            if (cap != null && cap.length() > 500) cap = cap.substring(0, 500);
            postRepo.updateField(postId, "caption", cap);
        }
        if (body.containsKey("locationTag")) {
            String loc = (String) body.get("locationTag");
            if (loc != null && loc.length() > 100) loc = loc.substring(0, 100);
            postRepo.updateField(postId, "location_tag", loc);
        }
        if (body.containsKey("visibility")) {
            postRepo.updateField(postId, "visibility", body.get("visibility"));
        }
        if (body.containsKey("commentsEnabled")) {
            postRepo.updateField(postId, "comments_enabled", Boolean.TRUE.equals(body.get("commentsEnabled")) ? 1 : 0);
        }

        var updated = postRepo.findById(postId, userId);
        return enrich(updated, userId);
    }

    public void deletePost(String postId, String userId) {
        var row = postRepo.findById(postId, userId);
        if (row == null) throw new ResourceNotFoundException("Post not found");
        if (!row.get("user_id").equals(userId))
            throw new ForbiddenException("You can only delete your own posts");
        postRepo.delete(postId);
    }

    @Transactional
    public PostResponse likePost(String postId, String userId) {
        var row = postRepo.findById(postId, userId);
        if (row == null) throw new ResourceNotFoundException("Post not found");
        postRepo.addLike(userId, postId);

        String ownerId = (String) row.get("user_id");
        if (!ownerId.equals(userId)) {
            var liker = userRepo.findById(userId);
            String username = (String) liker.getOrDefault("username", "Someone");
            String notifId = notificationRepo.create(ownerId, userId, "like", postId, null);
            pushService.sendPush(ownerId, "New Like",
                "@" + username + " liked your post",
                Map.of("type", "like", "actorId", userId, "postId", postId, "notificationId", notifId));
        }

        return enrich(postRepo.findById(postId, userId), userId);
    }

    public PostResponse unlikePost(String postId, String userId) {
        postRepo.removeLike(userId, postId);
        var row = postRepo.findById(postId, userId);
        if (row == null) throw new ResourceNotFoundException("Post not found");
        return enrich(row, userId);
    }

    public void bookmarkPost(String postId, String userId) {
        postRepo.addBookmark(userId, postId);
    }

    public void unbookmarkPost(String postId, String userId) {
        postRepo.removeBookmark(userId, postId);
    }

    public List<PostResponse> getBookmarkedPosts(String userId) {
        var rows = postRepo.getBookmarked(userId);
        return rows.stream().map(r -> enrich(r, userId)).collect(Collectors.toList());
    }

    public List<Map<String, Object>> searchPosts(String q, String currentUserId) {
        return postRepo.search(q, currentUserId);
    }

    public Map<String, Object> getExploreFeed(String currentUserId, int page, int limit) {
        List<Map<String, Object>> rows;
        long total;

        if (currentUserId != null) {
            rows = getSmartFeed(currentUserId, page, limit);
            var following = userRepo.query("SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted'", currentUserId);
            total = postRepo.countSmartFeed(currentUserId, following);
        } else {
            int offset = (page - 1) * limit;
            String sql = "SELECT p.*, " +
                "(p.like_count + p.comment_count * 2 + p.share_count * 3) / " +
                "GREATEST(1, POW(TIMESTAMPDIFF(HOUR, p.created_at, NOW()) + 1, 0.5)) as score " +
                "FROM posts p WHERE p.is_archived = 0 " +
                "ORDER BY score DESC LIMIT ? OFFSET ?";
            rows = userRepo.query(sql, limit, offset);
            total = postRepo.count(null);
        }

        if (currentUserId != null && !rows.isEmpty()) {
            return Map.of("posts", batchEnrich(rows, currentUserId), "total", total, "page", page);
        }
        return Map.of("posts", rows, "total", total, "page", page);
    }

    public List<Map<String, Object>> getTrendingHashtags() {
        return postRepo.getTrendingHashtags();
    }

    public Map<String, Object> getAnalytics(String userId) {
        var data = postRepo.getAnalytics(userId);
        return Map.of("analytics", data);
    }

    public Map<String, Object> getLeaderboard(String period) {
        String dateFilter = "weekly".equals(period)
            ? " AND p.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)"
            : "monthly".equals(period)
                ? " AND p.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)"
                : "";
        String sql = "SELECT p.location_tag as province, COUNT(*) as post_count, SUM(p.like_count) as total_likes, " +
            "SUM(p.view_count) as total_views, MAX(u.username) as top_creator, " +
            "MAX(u.avatar_url) as top_creator_avatar, " +
            "MAX(u.id) as top_creator_id " +
            "FROM posts p JOIN users u ON p.user_id = u.id " +
            "WHERE p.location_tag IS NOT NULL AND p.location_tag != ''" + dateFilter + " " +
            "GROUP BY p.location_tag ORDER BY total_likes DESC LIMIT 20";
        var rows = userRepo.query(sql);
        return Map.of("leaderboard", rows, "period", period);
    }

    public List<Map<String, Object>> getUserPosts(String userId, int page, int limit, String currentUserId) {
        var rows = postRepo.findByUserId(userId, page, limit);
        if (currentUserId != null && !rows.isEmpty()) {
            return batchEnrich(rows, currentUserId);
        }
        return rows;
    }

    public List<Map<String, Object>> getNearbyPosts(double lat, double lng, double radiusKm, String currentUserId) {
        return postRepo.findNearby(lat, lng, radiusKm, currentUserId);
    }

    private List<Map<String, Object>> batchEnrich(List<Map<String, Object>> rows, String currentUserId) {
        if (rows.isEmpty()) return rows;
        List<String> postIds = new java.util.ArrayList<>();
        List<String> creatorIds = new java.util.ArrayList<>();
        for (var row : rows) {
            postIds.add((String) row.get("id"));
            creatorIds.add((String) row.get("user_id"));
        }
        var likedSet = postRepo.batchIsLiked(currentUserId, postIds);
        var bookmarkedSet = postRepo.batchIsBookmarked(currentUserId, postIds);
        var followingSet = userRepo.batchIsFollowing(currentUserId, creatorIds);

        for (var row : rows) {
            String pid = (String) row.get("id");
            String uid = (String) row.get("user_id");
            boolean isFollowing = followingSet.contains(uid);
            row.put("is_liked_by_user", likedSet.contains(pid) ? 1 : 0);
            row.put("is_bookmarked_by_user", bookmarkedSet.contains(pid) ? 1 : 0);
            row.put("is_following_creator", isFollowing ? 1 : 0);
            if (isFollowing) {
                row.put("recommendation_reason", "From a creator you follow");
            } else {
                String loc = (String) row.get("location_tag");
                if (loc != null && !loc.isBlank()) {
                    row.put("recommendation_reason", "Trending near " + loc.split(",")[0].trim());
                } else {
                    row.put("recommendation_reason", "Recommended for you based on your interests");
                }
            }
        }
        return rows;
    }

    private PostResponse enrich(Map<String, Object> row, String currentUserId) {
        PostResponse p = PostResponse.fromMap(row, currentUserId);
        if (currentUserId != null) {
            p.isLikedByUser = postRepo.isLiked(currentUserId, p.id);
            p.isBookmarkedByUser = postRepo.isBookmarked(currentUserId, p.id);
            p.isFollowingCreator = userRepo.isFollowing(currentUserId, p.userId);
            if (p.isFollowingCreator) {
                p.recommendationReason = "From a creator you follow";
            } else if (p.locationTag != null && !p.locationTag.isBlank()) {
                p.recommendationReason = "Trending near " + p.locationTag.split(",")[0].trim();
            } else {
                p.recommendationReason = "Recommended for you based on your interests";
            }
        } else {
            if (p.locationTag != null && !p.locationTag.isBlank()) {
                p.recommendationReason = "Trending near " + p.locationTag.split(",")[0].trim();
            } else {
                p.recommendationReason = "Trending in your region";
            }
        }
        return p;
    }
}
