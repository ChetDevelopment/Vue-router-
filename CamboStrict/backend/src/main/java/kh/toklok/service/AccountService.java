package kh.toklok.service;

import kh.toklok.exception.BadRequestException;
import kh.toklok.exception.ResourceNotFoundException;
import kh.toklok.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class AccountService {

    private final JdbcTemplate db;
    private final PasswordEncoder encoder;
    private final UserRepository userRepo;

    public AccountService(JdbcTemplate db, PasswordEncoder encoder, UserRepository userRepo) {
        this.db = db;
        this.encoder = encoder;
        this.userRepo = userRepo;
    }

    @Transactional
    public Map<String, Object> deleteAccount(String userId, String password) {
        if (password == null || password.isBlank()) {
            throw new BadRequestException("Password is required to delete account");
        }
        var rows = db.query("SELECT password FROM users WHERE id = ?", (rs, i) -> rs.getString("password"), userId);
        if (rows.isEmpty()) throw new ResourceNotFoundException("User not found");
        if (!encoder.matches(password, rows.get(0)))
            throw new BadRequestException("Password does not match");

        // Record audit before the user row is gone
        String auditId = UUID.randomUUID().toString();
        db.update("INSERT INTO moderation_actions (id, moderator_id, action, reason, created_at) VALUES (?, ?, 'account_deleted', 'User self-deleted account', NOW())",
            auditId, userId);

        // Clean up all tables referencing this user
        // Messages & conversations
        db.update("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?", userId, userId);
        db.update("DELETE FROM conversation_participants WHERE user_id = ?", userId);
        db.update("DELETE FROM conversations WHERE id NOT IN (SELECT conversation_id FROM conversation_participants)");

        // Social graph
        db.update("DELETE FROM follows WHERE follower_id = ? OR following_id = ?", userId, userId);
        db.update("DELETE FROM blocked_users WHERE blocker_id = ? OR blocked_id = ?", userId, userId);

        // Notifications
        db.update("DELETE FROM notifications WHERE user_id = ? OR actor_id = ?", userId, userId);

        // Reports (anonymize by setting moderator references to null first)
        db.update("UPDATE reports SET moderator_id = NULL WHERE moderator_id = ?", userId);
        db.update("DELETE FROM reports WHERE reporter_id = ?", userId);

        // Moderation actions
        db.update("UPDATE moderation_actions SET moderator_id = NULL WHERE moderator_id = ?", userId);
        db.update("UPDATE moderation_actions SET target_user_id = NULL WHERE target_user_id = ?", userId);

        // User appeals
        db.update("DELETE FROM user_appeals WHERE user_id = ?", userId);
        db.update("UPDATE user_appeals SET reviewed_by = NULL WHERE reviewed_by = ?", userId);

        // Post-related data
        db.update("DELETE FROM post_relationships WHERE source_post_id IN (SELECT id FROM posts WHERE user_id = ?) OR target_post_id IN (SELECT id FROM posts WHERE user_id = ?)", userId, userId);
        db.update("DELETE FROM likes WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", userId);
        db.update("DELETE FROM bookmarks WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", userId);
        db.update("DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", userId);
        db.update("DELETE FROM post_hashtags WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", userId);
        db.update("DELETE FROM collection_posts WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", userId);
        db.update("DELETE FROM posts WHERE user_id = ?", userId);

        // Collections
        db.update("DELETE FROM collection_posts WHERE collection_id IN (SELECT id FROM collections WHERE user_id = ?)", userId);
        db.update("DELETE FROM collections WHERE user_id = ?", userId);

        // Live streaming
        db.update("UPDATE live_streams SET ended_at = NOW() WHERE user_id = ? AND ended_at IS NULL", userId);
        db.update("DELETE FROM live_viewers WHERE user_id = ?", userId);
        db.update("DELETE FROM live_streams WHERE user_id = ?", userId);

        // Payments & wallet
        db.update("DELETE FROM gift_transactions WHERE sender_id = ? OR receiver_id = ?", userId, userId);
        db.update("DELETE FROM payout_requests WHERE user_id = ?", userId);
        db.update("DELETE FROM creator_wallet WHERE user_id = ?", userId);

        // Content drafts & scheduling
        db.update("DELETE FROM drafts WHERE user_id = ?", userId);
        db.update("DELETE FROM scheduled_posts WHERE user_id = ?", userId);

        // History & sessions
        db.update("DELETE FROM watch_history WHERE user_id = ?", userId);
        db.update("DELETE FROM search_history WHERE user_id = ?", userId);
        db.update("DELETE FROM user_sessions WHERE user_id = ?", userId);
        db.update("DELETE FROM login_history WHERE user_id = ?", userId);
        db.update("DELETE FROM password_reset_tokens WHERE user_id = ?", userId);
        db.update("DELETE FROM user_preferences WHERE user_id = ?", userId);
        db.update("DELETE FROM verification_requests WHERE user_id = ?", userId);
        db.update("DELETE FROM push_tokens WHERE user_id = ?", userId);

        // Sound library (anonymize creator reference)
        db.update("UPDATE sound_library SET creator_id = NULL WHERE creator_id = ?", userId);

        // Rate limits
        db.update("DELETE FROM rate_limits WHERE bucket_key LIKE ?", "%" + userId + "%");

        // The user row itself
        db.update("DELETE FROM users WHERE id = ?", userId);

        return Map.of("message", "Account permanently deleted", "auditId", auditId);
    }

    public Map<String, Object> deactivateAccount(String userId) {
        String username = db.queryForObject("SELECT username FROM users WHERE id = ?", (rs, i) -> rs.getString("username"), userId);
        if (username == null) throw new ResourceNotFoundException("User not found");
        db.update("UPDATE users SET status = 'deactivated' WHERE id = ?", userId);
        return Map.of("message", "Account deactivated. You can reactivate by logging in again.");
    }

    public Map<String, Object> reactivateAccount(String userId) {
        int updated = db.update("UPDATE users SET status = 'active' WHERE id = ? AND status = 'deactivated'", userId);
        if (updated == 0) {
            throw new ResourceNotFoundException("No deactivated account found for this user");
        }
        return Map.of("message", "Account reactivated successfully");
    }
}
