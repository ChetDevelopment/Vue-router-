package kh.toklok.controller;

import kh.toklok.dto.*;
import kh.toklok.security.JwtUtil;
import kh.toklok.security.RateLimitingService;
import kh.toklok.security.TokenBlacklistService;
import kh.toklok.service.AuthService;
import kh.toklok.util.InputSanitizer;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;
    private final RateLimitingService rateLimiter;
    private final JdbcTemplate db;

    public AuthController(AuthService authService, JwtUtil jwtUtil,
                          TokenBlacklistService tokenBlacklistService,
                          RateLimitingService rateLimiter, JdbcTemplate db) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
        this.tokenBlacklistService = tokenBlacklistService;
        this.rateLimiter = rateLimiter;
        this.db = db;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req) {
        if (!rateLimiter.tryConsume("signup:" + req.username, 5, 5)) {
            return ResponseEntity.status(429).body(Map.of("error", Map.of("code", "RATE_LIMITED", "message", "Too many signup attempts")));
        }
        var result = authService.signup(req.username, req.password, req.displayName, req.email, req.phone);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        if (!rateLimiter.tryConsume("login:" + req.login, 10, 10)) {
            return ResponseEntity.status(429).body(Map.of("error", Map.of("code", "RATE_LIMITED", "message", "Too many login attempts")));
        }
        var result = authService.login(req.login, req.password);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        if (!rateLimiter.tryConsume("refresh:" + req.refreshToken, 5, 5)) {
            return ResponseEntity.status(429).body(Map.of("error", Map.of("code", "RATE_LIMITED", "message", "Too many refresh attempts")));
        }
        String refreshToken = req.refreshToken;
        if (refreshToken == null || !jwtUtil.validateToken(refreshToken)) {
            return ResponseEntity.status(401).body(Map.of("error", Map.of("code", "INVALID_TOKEN", "message", "Session expired. Please log in again.")));
        }
        // Check blacklist for old refresh tokens
        if (tokenBlacklistService.isBlacklisted(refreshToken)) {
            return ResponseEntity.status(401).body(Map.of("error", Map.of("code", "TOKEN_REVOKED", "message", "Session revoked. Please log in again.")));
        }
        String userId = jwtUtil.getUserIdFromToken(refreshToken);
        // Rotate tokens: blacklist old refresh for its full remaining TTL
        tokenBlacklistService.blacklist(refreshToken, System.currentTimeMillis() + jwtUtil.getRefreshExpirationMs());
        String newAccessToken = jwtUtil.generateToken(userId);
        String newRefreshToken = jwtUtil.generateRefreshToken(userId);
        return ResponseEntity.ok(Map.of("token", newAccessToken, "refreshToken", newRefreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication auth, @Valid @RequestBody(required = false) LogoutRequest req) {
        if (!rateLimiter.tryConsume("logout:" + (auth != null ? auth.getPrincipal() : "anon"), 5, 5)) {
            return ResponseEntity.status(429).body(Map.of("error", Map.of("code", "RATE_LIMITED", "message", "Too many logout attempts")));
        }
        String userId = auth != null ? (String) auth.getPrincipal() : null;
        if (req != null) {
            if (req.refreshToken != null) {
                tokenBlacklistService.blacklist(req.refreshToken, System.currentTimeMillis() + jwtUtil.getExpirationMs());
            }
            if (req.accessToken != null) {
                tokenBlacklistService.blacklist(req.accessToken, System.currentTimeMillis() + jwtUtil.getExpirationMs());
            }
        }
        // Clear push tokens for this user
        if (userId != null) {
            try {
                db.update("UPDATE push_tokens SET is_active = 0 WHERE user_id = ?", userId);
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully. See you next time!"));
    }

    @PostMapping("/send-verification")
    public ResponseEntity<?> sendVerification(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        var user = db.queryForList("SELECT id, email FROM users WHERE id = ?", userId);
        if (user.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        String email = (String) user.get(0).get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No email on file"));
        }
        // Generate 6-digit code
        String code = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
        db.update("INSERT INTO email_verifications (id, user_id, email, token, expires_at) VALUES (?,?,?,?,?)",
            UUID.randomUUID().toString(), userId, email, code,
            new java.sql.Timestamp(System.currentTimeMillis() + 900_000)); // 15 min
        return ResponseEntity.ok(Map.of("message", "Verification code sent"));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(Authentication auth, @RequestBody Map<String, String> body) {
        String userId = (String) auth.getPrincipal();
        String code = body.get("code");
        if (code == null) return ResponseEntity.badRequest().body(Map.of("error", "Code required"));

        var tokens = db.queryForList(
            "SELECT id FROM email_verifications WHERE user_id = ? AND token = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
            userId, code);
        if (tokens.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired code"));
        }
        db.update("UPDATE email_verifications SET used = 1 WHERE id = ?", tokens.get(0).get("id"));
        db.update("UPDATE users SET email_verified = 1 WHERE id = ?", userId);
        return ResponseEntity.ok(Map.of("message", "Email verified"));
    }

    @PostMapping("/social")
    public ResponseEntity<?> socialLogin(@RequestBody Map<String, String> body) {
        String provider = body.get("provider");
        String token = body.get("token");
        String email = body.get("email");
        String displayName = body.get("displayName");

        if (provider == null || token == null) {
            return ResponseEntity.badRequest().body(Map.of("error", Map.of("code", "INVALID_REQUEST", "message", "Provider and token required")));
        }

        String socialId = null;
        String socialEmail = null;
        String socialName = null;

        try {
            if ("google".equals(provider)) {
                var url = new java.net.URL("https://oauth2.googleapis.com/tokeninfo?id_token=" + token);
                var conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                int responseCode = conn.getResponseCode();
                if (responseCode != 200) {
                    return ResponseEntity.status(401).body(Map.of("error", Map.of("code", "INVALID_TOKEN", "message", "Google token verification failed")));
                }
                var json = new String(conn.getInputStream().readAllBytes());
                @SuppressWarnings("unchecked")
                var payload = new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, java.util.Map.class);
                socialId = (String) payload.get("sub");
                socialEmail = (String) payload.get("email");
                socialName = (String) payload.get("name");
            } else if ("facebook".equals(provider)) {
                var url = new java.net.URL("https://graph.facebook.com/me?access_token=" + token + "&fields=id,name,email,picture");
                var conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                int responseCode = conn.getResponseCode();
                if (responseCode != 200) {
                    return ResponseEntity.status(401).body(Map.of("error", Map.of("code", "INVALID_TOKEN", "message", "Facebook token verification failed")));
                }
                var json = new String(conn.getInputStream().readAllBytes());
                @SuppressWarnings("unchecked")
                var payload = new com.fasterxml.jackson.databind.ObjectMapper().readValue(json, java.util.Map.class);
                socialId = (String) payload.get("id");
                socialEmail = (String) payload.get("email");
                socialName = (String) payload.get("name");
            } else if ("apple".equals(provider)) {
                socialId = token;
                socialEmail = email;
                socialName = displayName;
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", Map.of("code", "INVALID_PROVIDER", "message", "Unsupported provider")));
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(AuthController.class).error("Social login verification failed", e);
            return ResponseEntity.status(502).body(Map.of("error", Map.of("code", "VERIFICATION_FAILED", "message", "Could not verify token with " + provider)));
        }

        if (socialId == null) {
            return ResponseEntity.status(401).body(Map.of("error", Map.of("code", "INVALID_TOKEN", "message", "Could not extract identity from token")));
        }

        // Check if user exists by social_id or email
        var existing = db.queryForList("SELECT id, username, email, display_name, avatar_url, bio, link, role, is_private, is_creator, is_verified, follower_count, following_count, total_likes_received, email_verified, status, created_at FROM users WHERE social_id = ?", provider + ":" + socialId);
        if (existing.isEmpty() && socialEmail != null) {
            existing = db.queryForList("SELECT id, username, email, display_name, avatar_url, bio, link, role, is_private, is_creator, is_verified, follower_count, following_count, total_likes_received, email_verified, status, created_at FROM users WHERE email = ?", socialEmail);
        }

        if (!existing.isEmpty()) {
            var user = existing.get(0);
            String userId = (String) user.get("id");
            // Ensure social_id is set
            db.update("UPDATE users SET social_id = ?, email_verified = 1 WHERE id = ? AND social_id IS NULL", provider + ":" + socialId, userId);
            String jwt = jwtUtil.generateToken(userId);
            String refresh = jwtUtil.generateRefreshToken(userId);
            return ResponseEntity.ok(Map.of("token", jwt, "refreshToken", refresh, "user", kh.toklok.dto.UserResponse.fromMap(user)));
        }

        // Create new user
        String username = InputSanitizer.sanitize("user_" + socialId.substring(0, Math.min(8, socialId.length())));
        String dispName = socialName != null ? InputSanitizer.sanitize(socialName) : username;
        String userEmail = socialEmail != null ? socialEmail : email;
        String id = java.util.UUID.randomUUID().toString();
        String bio = InputSanitizer.sanitize("Hi, I'm " + dispName.substring(0, Math.min(50, dispName.length())) + "!");
        db.update("INSERT INTO users (id, username, display_name, email, password, avatar_url, email_verified, social_id, bio) VALUES (?,?,?,?,?,?,?,?,?)",
            id, username, dispName, userEmail, "", null, 1, provider + ":" + socialId, bio);

        var newUser = db.queryForList("SELECT id, username, email, display_name, avatar_url, bio, link, role, is_private, is_creator, is_verified, follower_count, following_count, total_likes_received, email_verified, status, created_at FROM users WHERE id = ?", id);
        String jwt = jwtUtil.generateToken(id);
        String refresh = jwtUtil.generateRefreshToken(id);
        return ResponseEntity.ok(Map.of("token", jwt, "refreshToken", refresh, "user", kh.toklok.dto.UserResponse.fromMap(newUser.get(0))));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", Map.of("code", "UNAUTHORIZED", "message", "Not authenticated")));
        }
        String userId = (String) auth.getPrincipal();
        var user = authService.getMe(userId);
        return ResponseEntity.ok(Map.of("user", user));
    }
}
