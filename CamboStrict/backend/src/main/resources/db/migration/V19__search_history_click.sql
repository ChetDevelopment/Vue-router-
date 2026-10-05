SET @db = (SELECT DATABASE());

SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE table_schema = @db AND table_name = 'search_history' AND column_name = 'result_count');
SET @s = IF(@exists = 0, 'ALTER TABLE search_history ADD COLUMN result_count INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE table_schema = @db AND table_name = 'search_history' AND column_name = 'clicked_result_id');
SET @s = IF(@exists = 0, 'ALTER TABLE search_history ADD COLUMN clicked_result_id VARCHAR(36) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE table_schema = @db AND table_name = 'search_history' AND column_name = 'clicked_type');
SET @s = IF(@exists = 0, 'ALTER TABLE search_history ADD COLUMN clicked_type VARCHAR(20) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'search_history' AND index_name = 'idx_search_history_clicked');
SET @s = IF(@exists = 0, 'CREATE INDEX idx_search_history_clicked ON search_history(clicked_result_id)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
