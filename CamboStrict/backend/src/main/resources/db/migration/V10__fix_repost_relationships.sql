-- Fix repost FK constraint: source_post_id can be a user ID for repost type
-- We need to add a user_id column for tracking who created the relationship
-- and change the FK to allow NULL source_post_id for reposts

ALTER TABLE post_relationships ADD COLUMN user_id VARCHAR(36) DEFAULT NULL;
ALTER TABLE post_relationships ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_post_rel_user ON post_relationships(user_id);
