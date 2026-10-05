-- Phase 1: Following feed, block enforcement, duet/stitch, push notifications

-- Enhance blocked_users filtering support
ALTER TABLE blocked_users ADD INDEX idx_blocked_pair_direction (blocker_id, blocked_id);

-- Post relationships for duet/stitch/remix
CREATE TABLE post_relationships (
    id VARCHAR(36) PRIMARY KEY,
    source_post_id VARCHAR(36) NOT NULL,
    target_post_id VARCHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'duet', 'stitch', 'remix', 'repost'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_post_relationship (source_post_id, target_post_id, type),
    FOREIGN KEY (source_post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (target_post_id) REFERENCES posts(id) ON DELETE CASCADE,
    INDEX idx_post_rel_source (source_post_id),
    INDEX idx_post_rel_target (target_post_id),
    INDEX idx_post_rel_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Push notification tokens
CREATE TABLE push_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token TEXT NOT NULL,
    platform VARCHAR(10) DEFAULT 'ios', -- 'ios', 'android', 'web'
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_push_token (user_id, token(255)),
    INDEX idx_push_tokens_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
