package kh.toklok.security;

import kh.toklok.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
@Order(1)
public class JwtAuthFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserRepository userRepo;

    public JwtAuthFilter(JwtUtil jwtUtil, TokenBlacklistService tokenBlacklistService, UserRepository userRepo) {
        this.jwtUtil = jwtUtil;
        this.tokenBlacklistService = tokenBlacklistService;
        this.userRepo = userRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            // Check blacklist
            if (tokenBlacklistService.isBlacklisted(token)) {
                chain.doFilter(req, res);
                return;
            }

            if (jwtUtil.validateToken(token)) {
                String userId = jwtUtil.getUserIdFromToken(token);

                // Load user role for proper authorization
                try {
                    Map<String, Object> user = userRepo.findById(userId);
                    if (user == null) {
                        // User deleted — reject token
                        res.setStatus(401);
                        res.setContentType("application/json");
                        res.getWriter().write("{\"error\":{\"code\":\"USER_NOT_FOUND\",\"message\":\"User account no longer exists\"}}");
                        return;
                    }
                    String status = (String) user.get("status");
                    if (status != null && !"active".equals(status)) {
                        res.setStatus(401);
                        res.setContentType("application/json");
                        res.getWriter().write("{\"error\":{\"code\":\"ACCOUNT_INACTIVE\",\"message\":\"Account is " + status + "\"}}");
                        return;
                    }
                    List<GrantedAuthority> authorities = Collections.emptyList();
                    String role = (String) user.get("role");
                    if (role != null && !role.equals("user")) {
                        authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                    }
                    var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } catch (Exception e) {
                    logger.warn("Failed to load user role for user {}", userId, e);
                    res.setStatus(401);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"error\":{\"code\":\"AUTH_FAILED\",\"message\":\"Authentication failed\"}}");
                    return;
                }
            }
        }
        chain.doFilter(req, res);
    }
}
