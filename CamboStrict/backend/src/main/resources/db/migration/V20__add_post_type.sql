SET @db = (SELECT DATABASE());
SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE table_schema = @db AND table_name = 'posts' AND column_name = 'type');
SET @s = IF(@exists = 0, 'ALTER TABLE posts ADD COLUMN type VARCHAR(20) DEFAULT \'photo\' AFTER user_id', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
