package kh.toklok.service;

import kh.toklok.dto.UpdateProfileRequest;
import kh.toklok.dto.UserResponse;
import kh.toklok.exception.BadRequestException;
import kh.toklok.exception.ResourceNotFoundException;
import kh.toklok.util.InputSanitizer;
import kh.toklok.repository.NotificationRepository;
import kh.toklok.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepo;
    private final NotificationRepository notificationRepo;
    private final PushNotificationService pushService;
    private final kh.toklok.repository.PostRepository postRepo;

    public UserService(UserRepository userRepo, NotificationRepository notificationRepo,
                        PushNotificationService pushService,
                        kh.toklok.repository.PostRepository postRepo) {
        this.userRepo = userRepo;
        this.notificationRepo = notificationRepo;
        this.pushService = pushService;
        this.postRepo = postRepo;
    }

    public UserResponse getUser(String id, String currentUserId) {
        var row = userRepo.findById(id);
        if (row == null) throw new ResourceNotFoundException("User not found");
        UserResponse u = UserResponse.fromMap(row);
        if (currentUserId != null && currentUserId.equals(id)) {
            // Own profile — include email/phone
            u.email = (String) row.get("email");
            u.phone = (String) row.get("phone");
            u.isOwnProfile = true;
        } else if (currentUserId != null) {
            u.isFollowing = userRepo.isFollowing(currentUserId, id);
        }
        return u;
    }

    public UserResponse updateProfile(String userId, UpdateProfileRequest req) {
        Map<String, Object> fields = new LinkedHashMap<>();
        if (req.displayName != null) fields.put("display_name", InputSanitizer.sanitize(req.displayName));
        if (req.bio != null) fields.put("bio", InputSanitizer.sanitize(req.bio));
        if (req.link != null) fields.put("link", InputSanitizer.sanitize(req.link));
        if (req.avatarUrl != null) fields.put("avatar_url", req.avatarUrl);
        if (req.phone != null) fields.put("phone", req.phone);
        if (req.isPrivate != null) fields.put("is_private", req.isPrivate ? 1 : 0);
        if (req.isCreator != null) fields.put("is_creator", req.isCreator ? 1 : 0);
        if (!fields.isEmpty()) {
            userRepo.updateFields(userId, fields);
        }

        if (req.displayName != null) {
            userRepo.update("UPDATE posts SET user_display_name = ? WHERE user_id = ?", req.displayName, userId);
        }
        if (req.avatarUrl != null) {
            userRepo.update("UPDATE posts SET user_avatar = ? WHERE user_id = ?", req.avatarUrl, userId);
        }
        var row = userRepo.findById(userId);
        return UserResponse.fromMap(row);
    }

    @Transactional
    public void followUser(String myId, String targetId) {
        if (myId.equals(targetId)) throw new BadRequestException("Cannot follow yourself");
        // Check target is active
        var targetUser = userRepo.findById(targetId);
        if (targetUser == null) throw new ResourceNotFoundException("User not found");
        String targetStatus = (String) targetUser.get("status");
        if (targetStatus != null && !"active".equals(targetStatus)) {
            throw new BadRequestException("Cannot follow a deactivated account");
        }
        var existing = userRepo.query("SELECT id, status FROM follows WHERE follower_id = ? AND following_id = ?", myId, targetId);
        if (existing.isEmpty()) {
            // Check if target has private account — send follow request instead
            boolean isPrivate = Boolean.TRUE.equals(targetUser.get("is_private")) || "1".equals(String.valueOf(targetUser.get("is_private")));
            if (isPrivate) {
                // Create follow request (pending status)
                String id = UUID.randomUUID().toString();
                userRepo.update("INSERT INTO follows (id, follower_id, following_id, status) VALUES (?,?,?,'pending')", id, myId, targetId);
                String notifId = notificationRepo.create(targetId, myId, "follow_request", null, null);

                var follower = userRepo.findById(myId);
                String username = (String) follower.getOrDefault("username", "Someone");
                pushService.sendPush(targetId, "Follow Request",
                    "@" + username + " wants to follow you",
                    Map.of("type", "follow_request", "actorId", myId, "notificationId", notifId));
                return;
            }

            String id = UUID.randomUUID().toString();
            userRepo.update("INSERT INTO follows (id, follower_id, following_id) VALUES (?,?,?)", id, myId, targetId);
            userRepo.update("UPDATE users SET following_count = following_count + 1 WHERE id = ?", myId);
            userRepo.update("UPDATE users SET follower_count = follower_count + 1 WHERE id = ?", targetId);
            String notifId = notificationRepo.create(targetId, myId, "follow", null, null);

            // Send push notification
            var follower = userRepo.findById(myId);
            String username = (String) follower.getOrDefault("username", "Someone");
            pushService.sendPush(targetId, "New Follower",
                "@" + username + " started following you",
                Map.of("type", "follow", "actorId", myId, "notificationId", notifId));
        }
    }

    @Transactional
    public void approveFollowRequest(String approverId, String requesterId) {
        var existing = userRepo.query("SELECT id FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'pending'",
            requesterId, approverId);
        if (existing.isEmpty()) throw new BadRequestException("No pending follow request from this user");
        userRepo.update("UPDATE follows SET status = 'accepted' WHERE follower_id = ? AND following_id = ?",
            requesterId, approverId);
        userRepo.update("UPDATE users SET follower_count = follower_count + 1 WHERE id = ?", approverId);
        userRepo.update("UPDATE users SET following_count = following_count + 1 WHERE id = ?", requesterId);
        // Notify requester that request was approved
        notificationRepo.create(requesterId, approverId, "follow", null, null);
    }

    public void declineFollowRequest(String declinerId, String requesterId) {
        userRepo.update("DELETE FROM follows WHERE follower_id = ? AND following_id = ? AND status = 'pending'",
            requesterId, declinerId);
    }

    public void unfollowUser(String myId, String targetId) {
        var existing = userRepo.query("SELECT id FROM follows WHERE follower_id = ? AND following_id = ?", myId, targetId);
        if (!existing.isEmpty()) {
            userRepo.update("DELETE FROM follows WHERE follower_id = ? AND following_id = ?", myId, targetId);
            userRepo.update("UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = ?", myId);
            userRepo.update("UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = ?", targetId);
        }
    }

    public List<Map<String, Object>> getFollowers(String userId) {
        return userRepo.getFollowers(userId);
    }

    public List<Map<String, Object>> getFollowing(String userId) {
        return userRepo.getFollowing(userId);
    }

    public List<Map<String, Object>> searchUsers(String q, String currentUserId) {
        return userRepo.searchUsers(q, currentUserId);
    }

    @Transactional
    public void blockUser(String blockerId, String blockedId) {
        if (blockerId.equals(blockedId)) throw new BadRequestException("Cannot block yourself");
        var existing = userRepo.query("SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?", blockerId, blockedId);
        if (existing.isEmpty()) {
            userRepo.update("INSERT INTO blocked_users (id, blocker_id, blocked_id) VALUES (?,?,?)",
                UUID.randomUUID().toString(), blockerId, blockedId);
            // Also unfollow if following
            unfollowUser(blockerId, blockedId);
            unfollowUser(blockedId, blockerId);
        }
    }

    public void unblockUser(String blockerId, String blockedId) {
        userRepo.update("DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?", blockerId, blockedId);
    }

    public List<Map<String, Object>> getBlockedUsers(String userId) {
        return userRepo.query(
            "SELECT u.id, u.username, u.display_name, u.avatar_url FROM blocked_users b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ?",
            userId);
    }

    public List<Map<String, Object>> getSuggestedUsers(String currentUserId) {
        String sql = "SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.is_verified, u.follower_count " +
            "FROM users u WHERE u.is_creator = 1 AND u.status = 'active'";
        if (currentUserId != null) {
            sql += " AND u.id != ? AND u.id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)" +
                   " AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ? AND status = 'accepted')";
            return userRepo.query(sql + " ORDER BY u.follower_count DESC LIMIT 20", currentUserId, currentUserId, currentUserId);
        }
        return userRepo.query(sql + " ORDER BY u.follower_count DESC LIMIT 20");
    }

    public Map<String, Object> getUserPosts(String userId, int page, int limit, String currentUserId) {
        var rows = postRepo.findByUserId(userId, page, limit, currentUserId);
        long total = postRepo.countByUserId(userId);
        return Map.of("posts", rows, "total", total, "page", page);
    }
}
