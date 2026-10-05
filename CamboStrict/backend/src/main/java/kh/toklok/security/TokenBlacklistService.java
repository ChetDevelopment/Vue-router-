package kh.toklok.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    private final JdbcTemplate db;

    public TokenBlacklistService(JdbcTemplate db) {
        this.db = db;
    }

    public void blacklist(String token, long expiresAt) {
        try {
            String hash = sha256(token);
            db.update("INSERT INTO token_blacklist (id, token_hash, expires_at) VALUES (?,?,?)",
                UUID.randomUUID().toString(), hash, new java.sql.Timestamp(expiresAt));
        } catch (Exception e) {
            log.error("CRITICAL: Failed to blacklist token — token may still be valid", e);
            throw new RuntimeException("Failed to blacklist token", e);
        }
    }

    public boolean isBlacklisted(String token) {
        try {
            String hash = sha256(token);
            // Clean expired entries
            db.update("DELETE FROM token_blacklist WHERE expires_at < NOW()");
            var rows = db.query("SELECT id FROM token_blacklist WHERE token_hash = ?",
                (rs, i) -> rs.getString("id"), hash);
            return !rows.isEmpty();
        } catch (Exception e) {
            log.error("Failed to check token blacklist", e);
            return false;
        }
    }

    private String sha256(String input) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(input.getBytes());
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b & 0xff));
        }
        return hex.toString();
    }
}
