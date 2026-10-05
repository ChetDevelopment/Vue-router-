package kh.toklok.controller;

import kh.toklok.dto.ForgotPasswordRequest;
import kh.toklok.dto.ResetPasswordRequest;
import kh.toklok.exception.BadRequestException;
import kh.toklok.exception.ResourceNotFoundException;
import kh.toklok.security.RateLimitingService;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.security.SecureRandom;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class PasswordController {

    private final JdbcTemplate db;
    private final PasswordEncoder encoder;
    private final RateLimitingService rateLimiter;
    public PasswordController(JdbcTemplate db, PasswordEncoder encoder, RateLimitingService rateLimiter) {
        this.db = db;
        this.encoder = encoder;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        String email = req.email;

        if (!rateLimiter.tryConsume("forgot:" + email, 3, 3))
            return ResponseEntity.status(429).body(Map.of("error", Map.of("code", "RATE_LIMITED", "message", "Too many requests")));

        var users = db.query("SELECT id FROM users WHERE email = ?", (rs, i) -> rs.getString("id"), email);
        if (users.isEmpty())
            return ResponseEntity.ok(Map.of("message", "If the email exists, a reset code has been sent"));

        String userId = users.get(0);
        String token = generateOTP();
        long expiresAt = System.currentTimeMillis() + 900_000; // 15 minutes

        db.update("INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?,?,?,?)",
            UUID.randomUUID().toString(), userId, encoder.encode(token), new java.sql.Timestamp(expiresAt));

        return ResponseEntity.ok(Map.of("message", "If the email exists, a reset code has been sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        String email = req.email;
        String token = req.token;
        String newPassword = req.newPassword;

        if (email == null || token == null || newPassword == null)
            throw new BadRequestException("Email, token, and new password required");
        if (newPassword.length() < 12)
            throw new BadRequestException("Password must be at least 12 characters");

        var users = db.query("SELECT id FROM users WHERE email = ?", (rs, i) -> rs.getString("id"), email);
        if (users.isEmpty())
            throw new BadRequestException("Invalid request");

        String userId = users.get(0);

        var tokens = db.query("SELECT * FROM password_reset_tokens WHERE user_id = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
            (rs, i) -> Map.of("id", rs.getString("id"), "tokenHash", rs.getString("token")), userId);

        if (tokens.isEmpty())
            throw new BadRequestException("Invalid or expired token");

        String storedHash = (String) tokens.get(0).get("tokenHash");
        if (!encoder.matches(token, storedHash))
            throw new BadRequestException("Invalid token");

        String tokenId = (String) tokens.get(0).get("id");
        db.update("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", tokenId);
        db.update("UPDATE users SET password = ? WHERE id = ?", encoder.encode(newPassword), userId);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    private String generateOTP() {
        SecureRandom sr = new SecureRandom();
        int otp = Math.abs(sr.nextInt(Integer.MAX_VALUE)) % 1000000;
        return String.format("%06d", otp);
    }
}
