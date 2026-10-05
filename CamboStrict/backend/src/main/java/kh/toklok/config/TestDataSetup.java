package kh.toklok.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class TestDataSetup {
    private static final Logger log = LoggerFactory.getLogger(TestDataSetup.class);
    private final JdbcTemplate db;
    private final PasswordEncoder encoder;

    public TestDataSetup(JdbcTemplate db, PasswordEncoder encoder) {
        this.db = db;
        this.encoder = encoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void ensureTestUser() {
        String hash = encoder.encode("test1234");
        int updated = db.update(
            "INSERT IGNORE INTO users (id, username, display_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)",
            "user_test", "test", "Test User", "test@toklok.com", hash, "user"
        );
        if (updated > 0) {
            log.info("Created test user: test / test1234");
        }

        int j = db.update(
            "INSERT IGNORE INTO users (id, username, display_name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)",
            "user_jamz", "jamz", "Jamz", "jamz@toklok.com", hash, "user"
        );
        if (j > 0) {
            log.info("Created test user: jamz / test1234");
        }
    }
}
