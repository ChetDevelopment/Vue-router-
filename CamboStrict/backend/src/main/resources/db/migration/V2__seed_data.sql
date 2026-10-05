-- Seed users (passwords are BCrypt-hashed 'test1234')
INSERT INTO users (id, username, display_name, email, password, avatar_url, bio, is_verified, is_creator, follower_count, following_count, role) VALUES
('user_1', 'sokha_travels', 'Sokha Ly', 'sokha@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Exploring the hidden gems of Cambodia | Travel photographer', 1, 1, 24500, 420, 'creator'),
('user_2', 'khmer_kitchen', 'Chef Bopha', 'bopha@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Authentic Cambodian recipes passed down through generations', 1, 1, 48900, 150, 'creator'),
('user_3', 'piseth_tech', 'Piseth Khorn', 'piseth@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Tech reviewer in Phnom Penh. Making technology simple.', 0, 0, 1200, 310, 'user'),
('user_4', 'narith_vlog', 'Narith Seng', 'narith@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300', 'Vlogger based in Phnom Penh. Making people smile!', 0, 0, 3500, 820, 'user'),
('user_admin', 'toklok_moderator', 'TokLok Safety', 'moderator@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300', 'Official Safety and Community Moderation account', 1, 0, 150000, 5, 'moderator');

INSERT INTO posts (id, user_id, type, media_urls, cover_thumbnail_url, caption, location_tag, like_count, comment_count, share_count, view_count, username, user_avatar, user_display_name, is_user_verified, created_at) VALUES
('post_1', 'user_1', 'photo', '["https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&h=1000', 'Magical morning hike in Phnom Kulen National Park!', 'Phnom Kulen, Siem Reap', 1845, 124, 432, 5200, 'sokha_travels', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Sokha Ly', 1, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_2', 'user_2', 'photo', '["https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&h=1000', 'Cooking the ultimate Fish Amok today!', 'Phnom Penh, Cambodia', 4290, 312, 1205, 12400, 'khmer_kitchen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Chef Bopha', 1, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('post_3', 'user_4', 'photo', '["https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&h=1000', 'Trying to order coffee in Khmer with 0 hours of sleep vs 8 hours!', 'Brown Coffee, Phnom Penh', 981, 43, 220, 3400, 'narith_vlog', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300', 'Narith Seng', 0, DATE_SUB(NOW(), INTERVAL 8 HOUR));

INSERT INTO hashtags (id, tag, post_count) VALUES
('h1', 'AngkorWat', 145000),
('h2', 'KhmerFood', 98400),
('h3', 'PhnomPenh', 121000),
('h4', 'Amok', 45000),
('h5', 'Apsara', 32000),
('h6', 'SiemReap', 88900),
('h7', 'Sihanoukville', 54100),
('h8', 'Cambodia', 324000);
