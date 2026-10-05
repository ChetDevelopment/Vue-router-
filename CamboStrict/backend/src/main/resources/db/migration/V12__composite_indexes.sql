-- MySQL-compatible composite indexes for query performance
-- Uses information_schema to check before creating (simulating IF NOT EXISTS)

-- Posts: user profile posts query
SET @db = (SELECT DATABASE());
SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'posts' AND index_name = 'idx_posts_user_created');
SET @s = IF(@exists = 0, 'CREATE INDEX idx_posts_user_created ON posts(user_id, created_at)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Comments: post comment listing with order
SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'comments' AND index_name = 'idx_comments_post_created');
SET @s = IF(@exists = 0, 'CREATE INDEX idx_comments_post_created ON comments(post_id, created_at)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Follows: followers listing with order
SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'follows' AND index_name = 'idx_follows_status_created');
SET @s = IF(@exists = 0, 'CREATE INDEX idx_follows_status_created ON follows(following_id, status, created_at)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Notifications: user notification listing
SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'notifications' AND index_name = 'idx_notifications_user_created');
SET @s = IF(@exists = 0, 'CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Post tags: hashtag search
SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'post_hashtags' AND index_name = 'idx_post_hashtags_post');
SET @s = IF(@exists = 0, 'CREATE INDEX idx_post_hashtags_post ON post_hashtags(post_id)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Likes: post likes counting
SET @exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @db AND table_name = 'likes' AND index_name = 'idx_likes_created');
SET @s = IF(@exists = 0, 'CREATE INDEX idx_likes_created ON likes(created_at)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
