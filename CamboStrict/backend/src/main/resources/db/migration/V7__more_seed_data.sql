-- More realistic seed data with Cambodian content (no emoji — uses ASCII only to avoid encoding issues)
-- (passwords are BCrypt-hashed 'test1234' same as existing)

-- Add more users
INSERT IGNORE INTO users (id, username, display_name, email, password, avatar_url, bio, is_verified, is_creator, follower_count, following_count, role) VALUES
('user_6', 'rithy_adventure', 'Rithy Phal', 'rithy@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300', 'Adventure seeker | Hiking the Cardamom Mountains', 0, 1, 8900, 234, 'creator'),
('user_7', 'srey_makeup', 'Srey Pov', 'srey@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300', 'Makeup artist | Khmer beauty tips & tutorials', 0, 1, 15200, 445, 'creator'),
('user_8', 'dara_music', 'Dara Sok', 'dara@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Khmer pop singer | New single out now', 1, 1, 67800, 120, 'creator'),
('user_9', 'kampot_pepper', 'Kampot Kitchen', 'kampot@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&h=300', 'Farm-to-table cooking in Kampot', 0, 1, 4300, 89, 'creator'),
('user_10', 'siemreap_daily', 'Siem Reap Daily', 'daily@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=300&h=300', 'Daily life around Angkor Wat and Siem Reap', 0, 0, 22100, 312, 'user');

-- Add more posts with various media (ASCII captions only to avoid encoding issues)
INSERT IGNORE INTO posts (id, user_id, type, media_urls, cover_thumbnail_url, caption, location_tag, like_count, comment_count, share_count, view_count, username, user_avatar, user_display_name, is_user_verified, created_at) VALUES
('post_4', 'user_6', 'photo', '["https://images.unsplash.com/photo-1589308078053-be088b0e011a?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1589308078053-be088b0e011a?auto=format&fit=crop&w=600&h=1000', 'Sunrise hike in the Cardamom Mountains! The mist over the rainforest is breathtaking!', 'Cardamom Mountains, Koh Kong', 2341, 156, 678, 8900, 'rithy_adventure', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300', 'Rithy Phal', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_5', 'user_7', 'photo', '["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&h=1000', 'Traditional Khmer wedding makeup look! Golden and elegant for the ceremony.', 'Phnom Penh', 4521, 289, 1234, 15600, 'srey_makeup', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300', 'Srey Pov', 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
('post_6', 'user_8', 'photo', '["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&h=1000', 'Performing at the Koh Pich concert hall! Thank you Phnom Penh for the love!', 'Koh Pich, Phnom Penh', 8920, 567, 3456, 45200, 'dara_music', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Dara Sok', 1, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
('post_7', 'user_9', 'photo', '["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&h=1000', 'Fresh Kampot pepper crab! The best seafood you will ever taste.', 'Kampot', 3120, 234, 890, 12300, 'kampot_pepper', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&h=300', 'Kampot Kitchen', 0, DATE_SUB(NOW(), INTERVAL 7 HOUR)),
('post_8', 'user_10', 'photo', '["https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=600&h=1000', 'Angkor Wat at golden hour. Never gets old no matter how many times you see it.', 'Angkor Wat, Siem Reap', 6542, 412, 2100, 28900, 'siemreap_daily', 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=300&h=300', 'Siem Reap Daily', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_9', 'user_1', 'photo', '["https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=600&h=1000', 'Exploring the floating villages on Tonle Sap! These communities are incredible!', 'Tonle Sap, Siem Reap', 1876, 98, 345, 6700, 'sokha_travels', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Sokha Ly', 1, DATE_SUB(NOW(), INTERVAL 9 HOUR)),
('post_10', 'user_2', 'photo', '["https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&h=1000', 'Nom Banh Chok for breakfast! Rice noodles with fish gravy, the ultimate Khmer comfort food.', 'Phnom Penh', 3721, 267, 1102, 15400, 'khmer_kitchen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Chef Bopha', 1, DATE_SUB(NOW(), INTERVAL 10 HOUR)),
('post_11', 'user_3', 'photo', '["https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&h=1000', 'Unboxing the newest Samsung Galaxy! First impressions and camera test coming soon.', 'Phnom Penh', 892, 67, 156, 3400, 'piseth_tech', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Piseth Khorn', 0, DATE_SUB(NOW(), INTERVAL 11 HOUR));

-- Add some hashtags for posts
INSERT IGNORE INTO hashtags (id, tag, post_count) VALUES
('h9', 'CardamomMountains', 890),
('h10', 'KhmerWedding', 4500),
('h11', 'KampotPepper', 3200),
('h12', 'AngkorWat', 145000),
('h13', 'TonleSap', 2100),
('h14', 'NomBanhChok', 1800),
('h15', 'PhnomPenhConcert', 3400);

-- Link hashtags to posts
INSERT IGNORE INTO post_hashtags (id, post_id, hashtag_id) VALUES
(UUID(), 'post_4', 'h9'),
(UUID(), 'post_5', 'h10'),
(UUID(), 'post_7', 'h11'),
(UUID(), 'post_8', 'h12'),
(UUID(), 'post_9', 'h13'),
(UUID(), 'post_10', 'h14'),
(UUID(), 'post_6', 'h15');

-- Add some follows
INSERT IGNORE INTO follows (id, follower_id, following_id, status) VALUES
(UUID(), 'user_1', 'user_2', 'accepted'),
(UUID(), 'user_1', 'user_8', 'accepted'),
(UUID(), 'user_2', 'user_1', 'accepted'),
(UUID(), 'user_3', 'user_2', 'accepted'),
(UUID(), 'user_4', 'user_1', 'accepted'),
(UUID(), 'user_5', 'user_2', 'accepted'),
(UUID(), 'user_6', 'user_8', 'accepted'),
(UUID(), 'user_7', 'user_8', 'accepted');
