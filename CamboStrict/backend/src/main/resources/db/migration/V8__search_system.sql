-- Search system: synonyms, full-text indexes, search history, trending

-- 1. Synonym dictionary for keyword expansion
CREATE TABLE IF NOT EXISTS search_synonyms (
    id VARCHAR(36) PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    related_word VARCHAR(100) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_synonyms_keyword (keyword),
    INDEX idx_synonyms_related (related_word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Search history per user
CREATE TABLE IF NOT EXISTS search_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    query VARCHAR(200) NOT NULL,
    search_type VARCHAR(20) DEFAULT 'all',
    result_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_search_history_user (user_id, created_at),
    INDEX idx_search_history_query (query(50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Trending search terms (pre-computed)
CREATE TABLE IF NOT EXISTS trending_searches (
    id VARCHAR(36) PRIMARY KEY,
    term VARCHAR(200) NOT NULL,
    search_count INT DEFAULT 0,
    last_searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(50) DEFAULT 'general',
    UNIQUE KEY uk_trending_term (term),
    INDEX idx_trending_count (search_count DESC),
    INDEX idx_trending_recent (last_searched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Seed synonym data (English + basic Khmer)
INSERT IGNORE INTO search_synonyms (id, keyword, related_word, language) VALUES
-- Animals
(UUID(), 'dog', 'puppy', 'en'),
(UUID(), 'dog', 'pet', 'en'),
(UUID(), 'dog', 'canine', 'en'),
(UUID(), 'dog', 'retriever', 'en'),
(UUID(), 'cat', 'kitten', 'en'),
(UUID(), 'cat', 'feline', 'en'),
(UUID(), 'cat', 'pet', 'en'),
-- Vehicles
(UUID(), 'car', 'vehicle', 'en'),
(UUID(), 'car', 'auto', 'en'),
(UUID(), 'car', 'automobile', 'en'),
(UUID(), 'car', 'truck', 'en'),
-- Tech
(UUID(), 'phone', 'smartphone', 'en'),
(UUID(), 'phone', 'mobile', 'en'),
(UUID(), 'phone', 'iphone', 'en'),
(UUID(), 'phone', 'android', 'en'),
(UUID(), 'computer', 'laptop', 'en'),
(UUID(), 'computer', 'pc', 'en'),
(UUID(), 'computer', 'desktop', 'en'),
-- Gaming
(UUID(), 'game', 'gaming', 'en'),
(UUID(), 'game', 'gameplay', 'en'),
(UUID(), 'game', 'gamer', 'en'),
(UUID(), 'game', 'esports', 'en'),
-- Food
(UUID(), 'food', 'cooking', 'en'),
(UUID(), 'food', 'recipe', 'en'),
(UUID(), 'food', 'meal', 'en'),
(UUID(), 'food', 'dish', 'en'),
(UUID(), 'rice', 'rice', 'en'),
(UUID(), 'noodle', 'noodle', 'en'),
-- Cambodia-specific
(UUID(), 'angkot', 'angkor', 'en'),
(UUID(), 'angkot', 'temple', 'en'),
(UUID(), 'angkot', 'wat', 'en'),
(UUID(), 'phnom', 'mountain', 'en'),
(UUID(), 'phnom', 'hill', 'en'),
-- Travel
(UUID(), 'travel', 'trip', 'en'),
(UUID(), 'travel', 'journey', 'en'),
(UUID(), 'travel', 'vacation', 'en'),
(UUID(), 'travel', 'tour', 'en'),
(UUID(), 'beach', 'coast', 'en'),
(UUID(), 'beach', 'sea', 'en'),
(UUID(), 'beach', 'ocean', 'en'),
-- Music
(UUID(), 'music', 'song', 'en'),
(UUID(), 'music', 'audio', 'en'),
(UUID(), 'music', 'remix', 'en'),
(UUID(), 'dance', 'dancing', 'en'),
(UUID(), 'dance', 'choreography', 'en'),
-- Fitness
(UUID(), 'fitness', 'workout', 'en'),
(UUID(), 'fitness', 'exercise', 'en'),
(UUID(), 'fitness', 'gym', 'en'),
-- Fashion
(UUID(), 'fashion', 'style', 'en'),
(UUID(), 'fashion', 'clothing', 'en'),
(UUID(), 'makeup', 'beauty', 'en'),
(UUID(), 'makeup', 'cosmetic', 'en'),
-- Khmer specific
(UUID(), '%E1%9E%94%E1%9F%92%E1%9E%9A%E1%9E%B6%E1%9E%80%E1%9E%B6%E1%9E%9A', 'temple', 'km'),
(UUID(), '%E1%9E%81%E1%9E%BC%E1%9E%98%E1%9F%92%E1%9E%9A%E1%9E%84', 'food', 'km'),
(UUID(), '%E1%9E%91%E1%9F%80%E1%9E%9A', 'travel', 'km');

-- 5. Full-text indexes for efficient search
ALTER TABLE posts ADD FULLTEXT INDEX ft_posts_search (caption, location_tag);
ALTER TABLE users ADD FULLTEXT INDEX ft_users_search (username, display_name, bio);
ALTER TABLE hashtags ADD FULLTEXT INDEX ft_hashtags_search (tag);
ALTER TABLE sound_library ADD FULLTEXT INDEX ft_sounds_search (title, creator_name);
