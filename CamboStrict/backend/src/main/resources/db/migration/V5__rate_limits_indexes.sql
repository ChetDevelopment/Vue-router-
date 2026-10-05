-- Rate limiting table (DB-backed for multi-instance deployments)
CREATE TABLE IF NOT EXISTS rate_limits (
    id VARCHAR(36) PRIMARY KEY,
    bucket_key VARCHAR(255) NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rate_limits_key_time (bucket_key, requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MySQL-compatible index creation (IF NOT EXISTS emulation)
CREATE PROCEDURE IF NOT EXISTS create_index_if_not_exists(
    IN idx_name VARCHAR(128), IN tbl_name VARCHAR(128), IN idx_def VARCHAR(512)
) BEGIN
    SET @db = (SELECT DATABASE());
    SET @exists = (SELECT COUNT(*) FROM information_schema.statistics
        WHERE table_schema = @db AND table_name = tbl_name AND index_name = idx_name);
    IF @exists = 0 THEN
        SET @s = CONCAT('CREATE INDEX ', idx_name, ' ON ', tbl_name, ' ', idx_def);
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END;

CALL create_index_if_not_exists('idx_posts_created_at', 'posts', '(created_at)');
CALL create_index_if_not_exists('idx_follows_follower_status', 'follows', '(follower_id, status)');
CALL create_index_if_not_exists('idx_follows_following_status', 'follows', '(following_id, status)');

DROP PROCEDURE IF EXISTS create_index_if_not_exists;
