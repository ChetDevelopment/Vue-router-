package kh.toklok.service;

import kh.toklok.dto.UserResponse;
import kh.toklok.exception.BadRequestException;
import kh.toklok.exception.ConflictException;
import kh.toklok.util.InputSanitizer;
import kh.toklok.exception.ResourceNotFoundException;
import kh.toklok.repository.UserRepository;
import kh.toklok.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final JdbcTemplate db;
    private static final int MAX_ATTEMPTS = 10;
    private static final long LOCKOUT_DURATION_MS = 900_000;

    public AuthService(UserRepository userRepo, PasswordEncoder encoder, JwtUtil jwtUtil, JdbcTemplate db) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
        this.db = db;
    }

    public Map<String, Object> signup(String username, String password, String displayName, String email, String phone) {
        if (username.length() < 3 || username.length() > 20)
            throw new BadRequestException("Username must be 3-20 characters");
        if (password.length() < 12 || !password.matches(".*[0-9].*") || !password.matches(".*[a-z].*") || !password.matches(".*[A-Z].*") || !password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{}|;':\",./<>?].*"))
            throw new BadRequestException("Password must be 12+ characters with uppercase, lowercase, number, and special character");
        if (userRepo.existsByUsername(username))
            throw new ConflictException("Username taken");

        username = InputSanitizer.sanitize(username);
        String disp = (displayName != null && !displayName.isBlank()) ? InputSanitizer.sanitize(displayName) : username;
        if (disp.length() > 50) disp = disp.substring(0, 50);
        String bio = "Hi, I'm " + disp.substring(0, Math.min(50, disp.length())) + "!";

        String id = userRepo.create(username, disp, email, phone, encoder.encode(password), null, bio);
        String token = jwtUtil.generateToken(id);
        String refreshToken = jwtUtil.generateRefreshToken(id);

        Map<String, Object> user = userRepo.findById(id);
        return Map.of("token", token, "refreshToken", refreshToken, "user", UserResponse.fromMap(user));
    }

    public Map<String, Object> login(String login, String password) {
        if (login == null || login.isBlank())
            throw new BadRequestException("Credentials required");

        // Check account lockout (DB-backed — survives restarts)
        String lockKey = "login:" + login;
        try {
            // Clean expired attempts
            db.update("DELETE FROM rate_limits WHERE bucket_key = ? AND requested_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)", lockKey);
            int attempts = db.queryForObject(
                "SELECT COUNT(*) FROM rate_limits WHERE bucket_key = ? AND requested_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)",
                Integer.class, lockKey);
            if (attempts >= MAX_ATTEMPTS) {
                throw new BadRequestException("Account temporarily locked due to too many failed attempts. Try again in 15 minutes.");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lockout check failed for login: {}", login, e);
        }

        var users = userRepo.findByLogin(login);
        if (users.isEmpty()) {
            recordFailedAttempt(lockKey);
            throw new BadRequestException("The username or password you entered is incorrect. Please try again.");
        }

        Map<String, Object> user = users.get(0);
        String userStatus = (String) user.get("status");
        if (userStatus != null && !"active".equals(userStatus)) {
            throw new BadRequestException("Account is " + userStatus + ". Please contact support if you believe this is an error.");
        }

        if (!encoder.matches(password, (String) user.get("password"))) {
            recordFailedAttempt(lockKey);
            throw new BadRequestException("The username or password you entered is incorrect. Please try again.");
        }

        // Successful login — clear failed attempts
        try {
            db.update("DELETE FROM rate_limits WHERE bucket_key = ?", lockKey);
        } catch (Exception e) {
            log.error("Failed to clear lockout attempts for login: {}", login, e);
        }
        String userId = (String) user.get("id");
        String token = jwtUtil.generateToken(userId);
        String refreshToken = jwtUtil.generateRefreshToken(userId);
        return Map.of("token", token, "refreshToken", refreshToken, "user", UserResponse.fromMap(user));
    }

    private void recordFailedAttempt(String lockKey) {
        try {
            db.update("INSERT INTO rate_limits (id, bucket_key, requested_at) VALUES (?, ?, NOW())",
                UUID.randomUUID().toString(), lockKey);
        } catch (Exception e) {
            log.error("Failed to record failed login attempt", e);
        }
    }

    public UserResponse getMe(String userId) {
        var user = userRepo.findById(userId);
        if (user == null) throw new ResourceNotFoundException("User not found");
        return UserResponse.fromMap(user);
    }
}
