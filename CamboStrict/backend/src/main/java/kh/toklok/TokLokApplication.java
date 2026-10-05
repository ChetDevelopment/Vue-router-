package kh.toklok;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import javax.annotation.PostConstruct;

@SpringBootApplication
public class TokLokApplication {

    @Value("${app.jwt.secret:dev_jwt_secret_key_at_least_32_chars_long_for_dev}")
    private String jwtSecret;

    @PostConstruct
    public void validateConfig() {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalStateException(
                "JWT_SECRET must be at least 32 characters and set via environment variable. " +
                "Generate one with: openssl rand -base64 32"
            );
        }
    }

    @Bean
    public org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy repairFlyway() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }

    public static void main(String[] args) {
        SpringApplication.run(TokLokApplication.class, args);
    }
}
