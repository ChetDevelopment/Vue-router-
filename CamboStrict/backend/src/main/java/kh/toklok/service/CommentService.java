package kh.toklok.service;

import kh.toklok.dto.CommentResponse;
import kh.toklok.exception.ForbiddenException;
import kh.toklok.util.InputSanitizer;
import kh.toklok.exception.ResourceNotFoundException;
import kh.toklok.repository.CommentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository commentRepo;
    private final kh.toklok.repository.NotificationRepository notificationRepo;
    private final PushNotificationService pushService;
    private final org.springframework.jdbc.core.JdbcTemplate db;

    public CommentService(CommentRepository commentRepo,
                          kh.toklok.repository.NotificationRepository notificationRepo,
                          PushNotificationService pushController,
                          org.springframework.jdbc.core.JdbcTemplate db) {
        this.commentRepo = commentRepo;
        this.notificationRepo = notificationRepo;
        this.pushService = pushController;
        this.db = db;
    }

    public List<Map<String, Object>> getComments(String postId, String currentUserId) {
        var rows = commentRepo.findByPostId(postId, currentUserId);
        // Build comment tree: separate top-level from replies
        List<Map<String, Object>> topLevel = new java.util.ArrayList<>();
        java.util.Map<String, List<Map<String, Object>>> replyMap = new java.util.HashMap<>();

        for (var row : rows) {
            CommentResponse cr = CommentResponse.fromMap(row);
            // Serialize to map for nested structure
            java.util.Map<String, Object> cm = new java.util.LinkedHashMap<>();
            cm.put("id", cr.id);
            cm.put("postId", cr.postId);
            cm.put("userId", cr.userId);
            cm.put("username", cr.username);
            cm.put("userAvatar", cr.userAvatar);
            cm.put("userDisplayName", cr.userDisplayName);
            cm.put("content", cr.content);
            cm.put("likeCount", cr.likeCount);
            cm.put("createdAt", cr.createdAt);
            cm.put("isLikedByUser", cr.isLikedByUser);
            cm.put("parentCommentId", cr.parentCommentId);
            cm.put("replies", new java.util.ArrayList<>());

            if (cr.parentCommentId != null && !cr.parentCommentId.isBlank()) {
                replyMap.computeIfAbsent(cr.parentCommentId, k -> new java.util.ArrayList<>()).add(cm);
            } else {
                topLevel.add(cm);
            }
        }

        // Attach replies to their parents
        for (var top : topLevel) {
            String topId = (String) top.get("id");
            List<Map<String, Object>> replies = replyMap.get(topId);
            if (replies != null) {
                top.put("replies", replies);
            }
        }

        return topLevel;
    }

    @Transactional
    public CommentResponse addComment(String postId, String userId, String content, String parentCommentId) {
        if (content == null || content.isBlank())
            throw new IllegalArgumentException("Content required");
        if (content.length() > 500) content = content.substring(0, 500);
        content = InputSanitizer.sanitize(content);

        String id = commentRepo.add(postId, userId, content, parentCommentId);
        var row = commentRepo.findById(id);

        // Single user query — reused for mentions + push
        var commenterRows = db.query("SELECT id, username FROM users WHERE id = ?", (rs, i) -> Map.of("id", rs.getString("id"), "username", rs.getString("username")), userId);
        String commenterUsername = commenterRows.isEmpty() ? "Someone" : (String) commenterRows.get(0).get("username");

        // Batch @mention lookups
        java.util.Set<String> mentionedNames = new java.util.HashSet<>();
        java.util.regex.Matcher mentionMatcher = java.util.regex.Pattern.compile("@(\\w+)").matcher(content);
        while (mentionMatcher.find()) mentionedNames.add(mentionMatcher.group(1).toLowerCase());

        if (!mentionedNames.isEmpty()) {
            String placeholders = String.join(",", java.util.Collections.nCopies(mentionedNames.size(), "?"));
            var mentionedUsers = db.query("SELECT id FROM users WHERE username IN (" + placeholders + ")",
                (rs, i) -> rs.getString("id"), mentionedNames.toArray());
            for (String mentionedId : mentionedUsers) {
                if (!mentionedId.equals(userId)) {
                    String notifId = notificationRepo.create(mentionedId, userId, "mention", postId, content.substring(0, Math.min(80, content.length())));
                    pushService.sendPush(mentionedId, "New Mention",
                        "@" + commenterUsername + " mentioned you in a comment",
                        Map.of("type", "mention", "actorId", userId, "postId", postId, "notificationId", notifId));
                }
            }
        }

        // Send push notification to post owner
        var posts = db.query("SELECT user_id FROM posts WHERE id = ?", (rs, i) -> rs.getString("user_id"), postId);
        if (!posts.isEmpty()) {
            String ownerId = posts.get(0);
            if (!ownerId.equals(userId)) {
                String notifId = notificationRepo.create(ownerId, userId, "comment", postId, content.substring(0, Math.min(80, content.length())));
                pushService.sendPush(ownerId, "New Comment",
                    "@" + commenterUsername + " commented: " + content.substring(0, Math.min(50, content.length())),
                    Map.of("type", "comment", "actorId", userId, "postId", postId, "notificationId", notifId));
            }
        }

        return CommentResponse.fromMap(row);
    }

    public void deleteComment(String postId, String commentId, String userId) {
        Map<String, Object> comment = commentRepo.findById(commentId);
        if (comment == null) throw new ResourceNotFoundException("Comment not found");
        if (!comment.get("user_id").equals(userId))
            throw new ForbiddenException("You can only delete your own comments");
        commentRepo.delete(commentId, postId);
    }

    public CommentResponse likeComment(String commentId, String userId) {
        var comment = commentRepo.findById(commentId);
        if (comment == null) throw new ResourceNotFoundException("Comment not found");
        commentRepo.addLike(userId, commentId);
        var updated = commentRepo.findById(commentId);
        return CommentResponse.fromMap(updated);
    }

    public CommentResponse unlikeComment(String commentId, String userId) {
        commentRepo.removeLike(userId, commentId);
        var updated = commentRepo.findById(commentId);
        if (updated == null) throw new ResourceNotFoundException("Comment not found");
        return CommentResponse.fromMap(updated);
    }
}
