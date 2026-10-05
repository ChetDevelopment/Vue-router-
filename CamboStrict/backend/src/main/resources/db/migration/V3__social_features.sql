-- ============================================================
-- V3: Social & Engagement Features
-- ============================================================

-- 1. DIRECT MESSAGING
CREATE TABLE conversations (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(20) DEFAULT 'direct', -- 'direct', 'group'
    name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_conversations_type (type),
    INDEX idx_conversations_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE conversation_members (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_conv_member (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conv_members_user (user_id),
    INDEX idx_conv_members_conv (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    content TEXT,
    media_url TEXT,
    media_type VARCHAR(20), -- 'image', 'video', 'audio'
    reply_to_id VARCHAR(36),
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL,
    INDEX idx_messages_conversation (conversation_id, created_at),
    INDEX idx_messages_sender (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USER SESSIONS & DEVICES
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    device_type VARCHAR(20), -- 'ios', 'android', 'web'
    device_name VARCHAR(100),
    push_token TEXT,
    ip_address VARCHAR(45),
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_active (last_active_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    device_info TEXT,
    success TINYINT(1) DEFAULT 1,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_login_history_user (user_id),
    INDEX idx_login_history_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. USER ACTIVITY & HISTORY
CREATE TABLE watch_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    post_id VARCHAR(36) NOT NULL,
    watch_duration_seconds INT DEFAULT 0,
    completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_watch_user (user_id, created_at),
    INDEX idx_watch_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE search_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    query VARCHAR(200) NOT NULL,
    result_type VARCHAR(20), -- 'users', 'posts', 'hashtags', 'sounds'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_search_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. USER PREFERENCES
CREATE TABLE user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    language VARCHAR(10) DEFAULT 'km',
    content_language VARCHAR(10) DEFAULT 'km',
    autoplay_videos TINYINT(1) DEFAULT 1,
    save_watch_history TINYINT(1) DEFAULT 1,
    private_account TINYINT(1) DEFAULT 0,
    allow_duet TINYINT(1) DEFAULT 1,
    allow_stitch TINYINT(1) DEFAULT 1,
    allow_downloads TINYINT(1) DEFAULT 1,
    push_likes TINYINT(1) DEFAULT 1,
    push_comments TINYINT(1) DEFAULT 1,
    push_follows TINYINT(1) DEFAULT 1,
    push_messages TINYINT(1) DEFAULT 1,
    push_live TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. VERIFICATION & MODERATION
CREATE TABLE verification_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    full_name VARCHAR(100),
    government_id_url TEXT,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by VARCHAR(36),
    reviewed_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_verification_status (status),
    INDEX idx_verification_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE moderation_actions (
    id VARCHAR(36) PRIMARY KEY,
    moderator_id VARCHAR(36) NOT NULL,
    target_user_id VARCHAR(36),
    target_post_id VARCHAR(36),
    target_comment_id VARCHAR(36),
    action VARCHAR(50) NOT NULL, -- 'warn', 'suspend', 'ban', 'remove_post', 'remove_comment', 'dismiss_report'
    reason TEXT,
    duration_hours INT, -- for temporary suspensions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_mod_actions_created (created_at),
    INDEX idx_mod_actions_target (target_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_appeals (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    moderation_action_id VARCHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by VARCHAR(36),
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (moderation_action_id) REFERENCES moderation_actions(id) ON DELETE CASCADE,
    INDEX idx_appeals_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. GIFTING & MONETIZATION
CREATE TABLE gifts (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_url TEXT,
    price_riel INT NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    animation_url TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gifts_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gift_transactions (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    receiver_id VARCHAR(36) NOT NULL,
    gift_id VARCHAR(36) NOT NULL,
    post_id VARCHAR(36),
    quantity INT DEFAULT 1,
    total_riel INT NOT NULL,
    total_usd DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE,
    INDEX idx_gift_tx_sender (sender_id),
    INDEX idx_gift_tx_receiver (receiver_id),
    INDEX idx_gift_tx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE creator_wallet (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    balance_riel INT DEFAULT 0,
    balance_usd DECIMAL(10,2) DEFAULT 0,
    lifetime_earnings_riel INT DEFAULT 0,
    lifetime_earnings_usd DECIMAL(10,2) DEFAULT 0,
    pending_payout_riel INT DEFAULT 0,
    pending_payout_usd DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payout_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    amount_riel INT NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50), -- 'aba', 'wing', 'acleda', 'pipay'
    account_number VARCHAR(100),
    account_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
    processed_by VARCHAR(36),
    processed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payouts_status (status),
    INDEX idx_payouts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. LIVE STREAMING
CREATE TABLE live_streams (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200),
    thumbnail_url TEXT,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'live', 'ended', 'archived'
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    max_viewers INT DEFAULT 0,
    total_viewers INT DEFAULT 0,
    coin_earned INT DEFAULT 0,
    is_adult TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_live_status (status),
    INDEX idx_live_user (user_id),
    INDEX idx_live_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE live_viewers (
    id VARCHAR(36) PRIMARY KEY,
    stream_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    UNIQUE KEY uk_live_viewer (stream_id, user_id),
    FOREIGN KEY (stream_id) REFERENCES live_streams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_live_viewers_stream (stream_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. CONTENT FEATURES
CREATE TABLE drafts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    media_url TEXT,
    caption TEXT,
    location_tag VARCHAR(100),
    visibility VARCHAR(20) DEFAULT 'public',
    comments_enabled TINYINT(1) DEFAULT 1,
    sound_id VARCHAR(36),
    sound_name VARCHAR(100),
    sound_creator VARCHAR(100),
    filter_id VARCHAR(36),
    is_duet TINYINT(1) DEFAULT 0,
    duet_of_post_id VARCHAR(36),
    is_stitch TINYINT(1) DEFAULT 0,
    stitch_of_post_id VARCHAR(36),
    stitch_cut_duration INT,
    thumbnail_url TEXT,
    media_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_drafts_user (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sound_library (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    creator_name VARCHAR(100),
    creator_id VARCHAR(36),
    audio_url TEXT NOT NULL,
    cover_url TEXT,
    duration_seconds INT DEFAULT 0,
    category VARCHAR(50),
    is_original TINYINT(1) DEFAULT 0,
    usage_count INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_sounds_category (category),
    INDEX idx_sounds_usage (usage_count),
    INDEX idx_sounds_creator (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE content_reports (
    id VARCHAR(36) PRIMARY KEY,
    reporter_id VARCHAR(36) NOT NULL,
    target_type VARCHAR(20) NOT NULL, -- 'post', 'user', 'comment', 'message', 'live'
    target_id VARCHAR(36) NOT NULL,
    category VARCHAR(50), -- 'spam', 'harassment', 'nudity', 'violence', 'hate_speech', 'copyright', 'other'
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by VARCHAR(36),
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_content_reports_status (status),
    INDEX idx_content_reports_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TRENDING & DISCOVERY
CREATE TABLE trending_cache (
    id VARCHAR(36) PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'posts', 'hashtags', 'sounds', 'creators'
    item_id VARCHAR(36) NOT NULL,
    score DECIMAL(15,4) DEFAULT 0,
    metadata JSON,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    INDEX idx_trending_category (category, score DESC),
    INDEX idx_trending_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. SCHEDULED POSTS
CREATE TABLE scheduled_posts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    media_url TEXT,
    caption TEXT,
    location_tag VARCHAR(100),
    visibility VARCHAR(20) DEFAULT 'public',
    comments_enabled TINYINT(1) DEFAULT 1,
    sound_id VARCHAR(36),
    sound_name VARCHAR(100),
    sound_creator VARCHAR(100),
    scheduled_at TIMESTAMP NOT NULL,
    published TINYINT(1) DEFAULT 0,
    post_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_scheduled_user (user_id),
    INDEX idx_scheduled_at (scheduled_at, published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
