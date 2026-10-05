-- V16: Add missing indexes for query performance
-- Covers all columns used in WHERE, JOIN, ORDER BY clauses

-- users table
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_private ON users(is_private);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_follower_count ON users(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_users_following_count ON users(following_count DESC);
CREATE FULLTEXT INDEX IF NOT EXISTS ft_users_names ON users(username, display_name);

-- posts table
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON posts(is_archived);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_location_tag ON posts(location_tag);
CREATE INDEX IF NOT EXISTS idx_posts_engagement ON posts(like_count DESC, comment_count DESC, share_count DESC);
CREATE FULLTEXT INDEX IF NOT EXISTS ft_posts_caption ON posts(caption);

-- follows table
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status);
CREATE INDEX IF NOT EXISTS idx_follows_follower_status ON follows(follower_id, status);

-- blocked_users table
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- likes table (unique constraint already exists on user_id + post_id)
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- bookmarks table
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);

-- comments table
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- comment_likes table
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- conversation_participants table
CREATE INDEX IF NOT EXISTS idx_conv_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);

-- collection_posts table
CREATE INDEX IF NOT EXISTS idx_collection_posts_collection ON collection_posts(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_posts_post ON collection_posts(post_id);

-- post_relationships table
CREATE INDEX IF NOT EXISTS idx_post_relationships_source ON post_relationships(source_post_id);
CREATE INDEX IF NOT EXISTS idx_post_relationships_target ON post_relationships(target_post_id);
CREATE INDEX IF NOT EXISTS idx_post_relationships_type ON post_relationships(type);
CREATE INDEX IF NOT EXISTS idx_post_relationships_user ON post_relationships(user_id);

-- post_hashtags table
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);

-- hashtags table
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_post_count ON hashtags(post_count DESC);

-- search_history table
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

-- sound_library table
CREATE INDEX IF NOT EXISTS idx_sound_library_active ON sound_library(is_active);
CREATE INDEX IF NOT EXISTS idx_sound_library_usage ON sound_library(usage_count DESC);
CREATE FULLTEXT INDEX IF NOT EXISTS ft_sounds_names ON sound_library(title, creator_name, category);

-- password_reset_tokens table
CREATE INDEX IF NOT EXISTS idx_pwd_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_expires ON password_reset_tokens(expires_at);

-- rate_limits table
CREATE INDEX IF NOT EXISTS idx_rate_limits_bucket ON rate_limits(bucket_key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_requested ON rate_limits(requested_at);

-- push_tokens table
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
