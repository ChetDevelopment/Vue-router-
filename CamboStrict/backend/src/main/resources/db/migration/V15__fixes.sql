-- Fix repost unique key: allow multiple users to repost the same post
-- Previously: UNIQUE(source_post_id, target_post_id, type) — only one user could repost
ALTER TABLE post_relationships DROP INDEX IF EXISTS uk_post_relationship;
ALTER TABLE post_relationships DROP INDEX IF EXISTS uk_post_rel_unique;
-- Use prepared statement approach for MySQL compatibility
SET @db = (SELECT DATABASE());
SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'post_relationships' AND index_name = 'uk_post_rel_user');
SET @s = IF(@exists = 0, 'ALTER TABLE post_relationships ADD UNIQUE INDEX uk_post_rel_user (source_post_id(36), target_post_id(36), user_id(36), type(20))', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add missing foreign keys
SET @exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE table_schema = @db AND table_name = 'moderation_actions' AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%report%');
SET @s = IF(@exists = 0, 'ALTER TABLE moderation_actions ADD CONSTRAINT fk_mod_actions_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Composite indexes for common query patterns
SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'users' AND index_name = 'idx_users_creator_status');
SET @s = IF(@exists = 0, 'CREATE INDEX idx_users_creator_status ON users(is_creator, status, follower_count DESC)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'bookmarks' AND index_name = 'idx_bookmarks_user_created');
SET @s = IF(@exists = 0, 'CREATE INDEX idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'follows' AND index_name = 'idx_follows_following_status_created');
SET @s = IF(@exists = 0, 'CREATE INDEX idx_follows_following_status_created ON follows(following_id, status, created_at DESC)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
