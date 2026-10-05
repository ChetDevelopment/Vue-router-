package kh.toklok.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);
    private final RateLimitingService rateLimiter;

    public RateLimitFilter(RateLimitingService rateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String path = req.getRequestURI();
        String method = req.getMethod();

        int capacity;
        if (path.contains("/auth/")) {
            capacity = 10;
        } else if ("POST".equals(method) || "PATCH".equals(method) || "DELETE".equals(method)) {
            capacity = 30;
        } else {
            capacity = 120;
        }

        String xff = req.getHeader("X-Forwarded-For");
        String clientIp = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
        String key = clientIp + ":" + path;
        if (!rateLimiter.tryConsume(key, capacity, capacity)) {
            logger.warn("Rate limit exceeded for {} {} from {}", method, path, clientIp);
            res.setStatus(429);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":{\"code\":\"RATE_LIMITED\",\"message\":\"Too many requests. Try again later.\"}}");
            return;
        }

        chain.doFilter(req, res);
    }
}
