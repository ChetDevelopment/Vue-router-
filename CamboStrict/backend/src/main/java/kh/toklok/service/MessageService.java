package kh.toklok.service;

import kh.toklok.util.InputSanitizer;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class MessageService {

    private final JdbcTemplate db;

    public MessageService(JdbcTemplate db) {
        this.db = db;
    }

    public List<Map<String, Object>> getConversations(String userId) {
        return db.queryForList(
            "SELECT c.*, " +
            "lm.content as last_message, " +
            "ou.username as other_username, " +
            "ou.avatar_url as other_avatar " +
            "FROM conversations c " +
            "JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.user_id = ? " +
            "JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != ? " +
            "JOIN users ou ON cp2.user_id = ou.id " +
            "LEFT JOIN LATERAL ( " +
            "  SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1 " +
            ") lm ON true " +
            "ORDER BY COALESCE((SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1), c.created_at) DESC",
            userId, userId);
    }

    public Map<String, Object> createConversation(String userId, String targetUserId) {
        // Check existing conversation between these two users
        var existing = db.queryForList(
            "SELECT c.id FROM conversations c " +
            "JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ? " +
            "JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ? " +
            "WHERE (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2",
            userId, targetUserId);
        if (!existing.isEmpty()) {
            return Map.of("id", existing.get(0).get("id"));
        }

        String convId = UUID.randomUUID().toString();
        db.update("INSERT INTO conversations (id) VALUES (?)", convId);
        db.update("INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?,?,?)",
            UUID.randomUUID().toString(), convId, userId);
        db.update("INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?,?,?)",
            UUID.randomUUID().toString(), convId, targetUserId);
        return Map.of("id", convId);
    }

    public List<Map<String, Object>> getMessages(String conversationId, String userId, int page) {
        int offset = (page - 1) * 50;
        return db.queryForList(
            "SELECT m.*, u.username as sender_username, u.avatar_url as sender_avatar " +
            "FROM messages m JOIN users u ON m.sender_id = u.id " +
            "WHERE m.conversation_id = ? ORDER BY m.created_at DESC LIMIT 50 OFFSET ?",
            conversationId, offset);
    }

    public boolean isParticipant(String conversationId, String userId) {
        var rows = db.queryForList(
            "SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?",
            conversationId, userId);
        return !rows.isEmpty();
    }

    public Map<String, Object> sendMessage(String conversationId, String userId, String content, String postId) {
        String msgId = UUID.randomUUID().toString();
        String msgType = postId != null ? "post" : "text";
        String safeContent = InputSanitizer.sanitize(content);
        db.update("INSERT INTO messages (id, conversation_id, sender_id, content, type, post_id) VALUES (?,?,?,?,?,?)",
            msgId, conversationId, userId, safeContent, msgType, postId);
        return Map.of("id", msgId);
    }

    public void markRead(String conversationId, String userId) {
        db.update("UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?",
            conversationId, userId);
    }
}
