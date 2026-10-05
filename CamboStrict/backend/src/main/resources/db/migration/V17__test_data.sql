-- V17: Test data for development — fake accounts and 60+ posts for feed scrolling
-- Password for all user accounts: test1234
-- Test login user: test / test1234 (username field)

-- ============================================================
-- Add test user account (easy credentials for testing)
-- ============================================================
INSERT IGNORE INTO users (id, username, display_name, email, password, avatar_url, bio, is_verified, is_creator, follower_count, following_count, role) VALUES
('user_test', 'test', 'Test User', 'test@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, 'This is a test account for scrolling the feed', 0, 0, 500, 100, 'user');

-- ============================================================
-- Generate 60+ posts across existing users (post_12 through post_75)
-- Using Unsplash image IDs for variety in media
-- ============================================================

INSERT IGNORE INTO posts (id, user_id, media_urls, cover_thumbnail_url, caption, location_tag, like_count, comment_count, share_count, view_count, username, user_avatar, user_display_name, is_user_verified, created_at) VALUES

-- user_1 (sokha_travels) — 8 travel posts
('post_12', 'user_1', '["https://images.unsplash.com/photo-1500530855697-b586d89ba7ee?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1500530855697-b586d89ba7ee?auto=format&fit=crop&w=600&h=1000', 'Bamboo train adventure in Battambang!', 'Battambang', 1567, 89, 234, 4200, 'sokha_travels', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Sokha Ly', 1, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_13', 'user_1', '["https://images.unsplash.com/photo-1523800503107-5bc3ba2a6f81?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1523800503107-5bc3ba2a6f81?auto=format&fit=crop&w=600&h=1000', 'Sunset at the Royal Palace. Phnom Penh never disappoints!', 'Royal Palace, Phnom Penh', 2100, 145, 321, 6700, 'sokha_travels', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Sokha Ly', 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_14', 'user_1', '["https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&h=1000', 'Morning fog over the Mekong River view from my hotel', 'Mekong River, Kratie', 890, 56, 123, 2800, 'sokha_travels', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Sokha Ly', 1, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_15', 'user_1', '["https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&h=1000', 'Exploring the temples of Koh Ker! Less crowded than Angkor but just as amazing', 'Koh Ker Temple', 1765, 98, 267, 5100, 'sokha_travels', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Sokha Ly', 1, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
('post_16', 'user_1', '["https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&h=1000', 'Working remote from a cafe in Siem Reap! Digital nomad life', 'Siem Reap', 2340, 167, 432, 8900, 'sokha_travels', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Sokha Ly', 1, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('post_17', 'user_1', '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=1000', 'Beach day in Sihanoukville! Otres Beach is the spot!', 'Otres Beach, Sihanoukville', 3100, 234, 567, 12400, 'sokha_travels', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Sokha Ly', 1, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
('post_18', 'user_1', '["https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=600&h=1000', 'Hiking in Virachey National Park! Remote jungle adventure', 'Virachey NP, Ratanakiri', 1200, 67, 189, 3400, 'sokha_travels', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Sokha Ly', 1, DATE_SUB(NOW(), INTERVAL 7 HOUR)),

-- user_2 (khmer_kitchen) — 8 food posts
('post_19', 'user_2', '["https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=600&h=1000', 'Making fresh spring rolls! So refreshing for hot days', 'Phnom Penh', 2800, 189, 456, 10200, 'khmer_kitchen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Chef Bopha', 1, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_20', 'user_2', '["https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=600&h=1000', 'Beef Lok Lak — the perfect pepper sauce is everything!', 'Phnom Penh', 4100, 312, 890, 16700, 'khmer_kitchen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Chef Bopha', 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_21', 'user_2', '["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=1000', 'Kuy Teav for breakfast! The broth takes 4 hours to make', 'Phnom Penh', 3200, 245, 678, 13500, 'khmer_kitchen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Chef Bopha', 1, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_22', 'user_2', '["https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&h=1000', 'Mango sticky rice dessert! Sweet coconut cream on top', 'Phnom Penh', 4500, 356, 1200, 19800, 'khmer_kitchen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Chef Bopha', 1, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
('post_23', 'user_2', '["https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=600&h=1000', 'Bok Lhong (pumpkin custard) — a traditional Khmer dessert!', 'Phnom Penh', 1900, 134, 345, 7200, 'khmer_kitchen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Chef Bopha', 1, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('post_24', 'user_2', '["https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&h=1000', 'Cha Houy Teuk (coconut jelly) — perfect for hot days!', 'Siem Reap', 2340, 178, 456, 9600, 'khmer_kitchen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Chef Bopha', 1, DATE_SUB(NOW(), INTERVAL 6 HOUR)),

-- user_3 (piseth_tech) — 6 tech posts
('post_25', 'user_3', '["https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=600&h=1000', 'My new MacBook Pro setup! Perfect for video editing on the go', 'Phnom Penh', 1200, 89, 234, 4500, 'piseth_tech', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Piseth Khorn', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_26', 'user_3', '["https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=600&h=1000', 'Affordable wireless earbuds review! 10 options under $50', 'Phnom Penh', 890, 67, 156, 3200, 'piseth_tech', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Piseth Khorn', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_27', 'user_3', '["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&h=1000', 'Best budget smartphones available in Cambodia right now', 'Phnom Penh', 1500, 112, 267, 5600, 'piseth_tech', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Piseth Khorn', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_28', 'user_3', '["https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&h=1000', '5G finally rolling out in Cambodia! What you need to know', 'Phnom Penh', 2100, 156, 378, 7800, 'piseth_tech', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Piseth Khorn', 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- user_4 (narith_vlog) — 6 vlog posts
('post_29', 'user_4', '["https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=600&h=1000', 'Day in my life as a content creator in Phnom Penh!', 'Phnom Penh', 3400, 267, 890, 14500, 'narith_vlog', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300', 'Narith Seng', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_30', 'user_4', '["https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&h=1000', 'Hanging out with friends at the Riverside! Best weekend ever!', 'Riverside, Phnom Penh', 2800, 198, 567, 11200, 'narith_vlog', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300', 'Narith Seng', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_31', 'user_4', '["https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&h=1000', 'My content creation gear! Everything I use to make videos', 'Phnom Penh', 1900, 134, 345, 6700, 'narith_vlog', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300', 'Narith Seng', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_32', 'user_4', '["https://images.unsplash.com/photo-1531747059667-7a8f0e76c5d6?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1531747059667-7a8f0e76c5d6?auto=format&fit=crop&w=600&h=1000', 'Trying Durian for the first time! My honest reaction!', 'Phnom Penh', 5600, 432, 1200, 23400, 'narith_vlog', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300', 'Narith Seng', 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- user_6 (rithy_adventure) — 6 adventure posts
('post_33', 'user_6', '["https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&h=1000', 'Waterfall trekking in Mondulkiri! The falls are incredible this season!', 'Mondulkiri', 2100, 156, 345, 8900, 'rithy_adventure', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300', 'Rithy Phal', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_34', 'user_6', '["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&h=1000', 'Camping under the stars in the Cardamom Mountains!', 'Cardamom Mountains', 1670, 112, 234, 5600, 'rithy_adventure', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300', 'Rithy Phal', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_35', 'user_6', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&h=1000', 'Jungle trekking in Botum Sakor National Park! Saw wild elephants!', 'Botum Sakor NP', 3400, 267, 678, 13400, 'rithy_adventure', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300', 'Rithy Phal', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_36', 'user_6', '["https://images.unsplash.com/photo-1470071459604-3b863ec4a2f2?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1470071459604-3b863ec4a2f2?auto=format&fit=crop&w=600&h=1000', 'Kayaking through the mangroves in Koh Kong!', 'Koh Kong', 1450, 98, 189, 4300, 'rithy_adventure', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300', 'Rithy Phal', 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- user_7 (srey_makeup) — 6 beauty posts
('post_37', 'user_7', '["https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=600&h=1000', 'Everyday natural makeup tutorial! Quick and easy for work', 'Phnom Penh', 3800, 290, 780, 14500, 'srey_makeup', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300', 'Srey Pov', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_38', 'user_7', '["https://images.unsplash.com/photo-1457972729786-0411a3b2b626?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?auto=format&fit=crop&w=600&h=1000', 'My top 5 skincare products for Khmer weather!', 'Phnom Penh', 2900, 210, 567, 10200, 'srey_makeup', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300', 'Srey Pov', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_39', 'user_7', '["https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=600&h=1000', 'Pwater Splash Festival makeup look! Colorful and fun!', 'Phnom Penh', 4200, 334, 1002, 17800, 'srey_makeup', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300', 'Srey Pov', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_40', 'user_7', '["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&h=1000', 'Bridal makeup preview! Getting ready for wedding season', 'Phnom Penh', 5100, 398, 1400, 20100, 'srey_makeup', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300', 'Srey Pov', 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- user_8 (dara_music) — 6 music posts
('post_41', 'user_8', '["https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&h=1000', 'New single dropping next week! Here is a sneak peek of the music video!', 'Phnom Penh', 9800, 720, 3400, 52000, 'dara_music', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Dara Sok', 1, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_42', 'user_8', '["https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&h=1000', 'Recording session at the studio! This song is going to be special!', 'Phnom Penh', 6700, 500, 2100, 34000, 'dara_music', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Dara Sok', 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_43', 'user_8', '["https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&h=1000', 'Meet and greet with fans at AEON Mall! Thank you for the support!', 'AEON Mall, Phnom Penh', 7500, 600, 2500, 41000, 'dara_music', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Dara Sok', 1, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_44', 'user_8', '["https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&h=1000', 'Behind the scenes of my latest music video shoot!', 'Siem Reap', 5400, 410, 1800, 28000, 'dara_music', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Dara Sok', 1, DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- user_9 (kampot_pepper) — 6 food posts
('post_45', 'user_9', '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&h=1000', 'Fresh seafood feast with Kampot pepper! Nothing beats this!', 'Kampot', 3100, 234, 567, 12300, 'kampot_pepper', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&h=300', 'Kampot Kitchen', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_46', 'user_9', '["https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&h=1000', 'Morning at the Kampot market! Fresh produce everywhere!', 'Kampot Market', 1800, 134, 289, 6700, 'kampot_pepper', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&h=300', 'Kampot Kitchen', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_47', 'user_9', '["https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&h=1000', 'How to make Kampot pepper crab at home! Full recipe in comments!', 'Kampot', 2600, 200, 450, 9800, 'kampot_pepper', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&h=300', 'Kampot Kitchen', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_48', 'user_9', '["https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&h=1000', 'Durian season has begun! Love it or hate it?', 'Kampot', 4900, 380, 1100, 19800, 'kampot_pepper', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&h=300', 'Kampot Kitchen', 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- user_10 (siemreap_daily) — 6 Siem Reap posts
('post_49', 'user_10', '["https://images.unsplash.com/photo-1508154048109-de55526b81a7?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1508154048109-de55526b81a7?auto=format&fit=crop&w=600&h=1000', 'Pub Street is alive tonight! Best nightlife in Siem Reap!', 'Pub Street, Siem Reap', 4200, 340, 890, 17600, 'siemreap_daily', 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=300&h=300', 'Siem Reap Daily', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_50', 'user_10', '["https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=600&h=1000', 'Sunrise at Angkor Wat! The most beautiful place on earth!', 'Angkor Wat, Siem Reap', 8900, 670, 2800, 45000, 'siemreap_daily', 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=300&h=300', 'Siem Reap Daily', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_51', 'user_10', '["https://images.unsplash.com/photo-1470071459604-3b863ec4a2f2?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1470071459604-3b863ec4a2f2?auto=format&fit=crop&w=600&h=1000', 'Tonle Sap floating village tour! An incredible way of life!', 'Tonle Sap, Siem Reap', 3400, 267, 678, 13400, 'siemreap_daily', 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=300&h=300', 'Siem Reap Daily', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_52', 'user_10', '["https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&h=1000', 'Digital nomad cafe guide in Siem Reap! Best wifi spots!', 'Siem Reap', 2300, 178, 400, 8900, 'siemreap_daily', 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=300&h=300', 'Siem Reap Daily', 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- user_test posts — 8 posts from test user
('post_53', 'user_test', '["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&h=1000', 'Test post 1 — just scrolling through!', 'Phnom Penh', 120, 15, 23, 800, 'test', NULL, 'Test User', 0, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('post_54', 'user_test', '["https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=600&h=1000', 'Test post 2 — enjoying the TokLok feed!', 'Phnom Penh', 89, 10, 12, 450, 'test', NULL, 'Test User', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_55', 'user_test', '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=1000', 'Test post 3 — beach vibes!', 'Sihanoukville', 200, 25, 30, 1000, 'test', NULL, 'Test User', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_56', 'user_test', '["https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&h=1000', 'Test post 4 — nature walk!', 'Kampot', 150, 18, 20, 600, 'test', NULL, 'Test User', 0, DATE_SUB(NOW(), INTERVAL 4 HOUR)),
('post_57', 'user_test', '["https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&h=1000', 'Test post 5 — working from a cafe!', 'Phnom Penh', 175, 22, 28, 750, 'test', NULL, 'Test User', 0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('post_58', 'user_test', '["https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=600&h=1000', 'Test post 6 — exploring the countryside!', 'Battambang', 95, 12, 15, 350, 'test', NULL, 'Test User', 0, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
('post_59', 'user_test', '["https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&h=1000', 'Test post 7 — food adventures!', 'Siem Reap', 310, 45, 52, 1400, 'test', NULL, 'Test User', 0, DATE_SUB(NOW(), INTERVAL 7 HOUR)),
('post_60', 'user_test', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&h=1000', 'Test post 8 — nature photography!', 'Mondulkiri', 130, 16, 18, 520, 'test', NULL, 'Test User', 0, DATE_SUB(NOW(), INTERVAL 8 HOUR));

-- More posts from user_1 through user_10 (extra variety)
INSERT IGNORE INTO posts (id, user_id, media_urls, cover_thumbnail_url, caption, location_tag, like_count, comment_count, share_count, view_count, username, user_avatar, user_display_name, is_user_verified, created_at) VALUES
('post_61', 'user_2', '["https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=600&h=1000', 'Bai Sach Chrouk for breakfast! Grilled pork and rice, simple and delicious!', 'Phnom Penh', 3500, 260, 700, 14000, 'khmer_kitchen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Chef Bopha', 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('post_62', 'user_6', '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&h=1000', 'Top 10 hiking trails in Cambodia you need to try!', 'Cambodia', 2800, 210, 500, 11000, 'rithy_adventure', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300', 'Rithy Phal', 0, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('post_63', 'user_7', '["https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&h=1000', 'How to get glass skin in humid weather! My Khmer skincare routine', 'Phnom Penh', 4500, 350, 900, 18000, 'srey_makeup', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300', 'Srey Pov', 0, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('post_64', 'user_8', '["https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&h=1000', 'Acoustic version of my latest song! Hope you enjoy!', 'Phnom Penh', 8200, 620, 2500, 42000, 'dara_music', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Dara Sok', 1, DATE_SUB(NOW(), INTERVAL 6 HOUR)),
('post_65', 'user_1', '["https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&h=1000', 'Mekong River cruise at sunset! Unforgettable experience!', 'Kratie', 2500, 180, 400, 9500, 'sokha_travels', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', 'Sokha Ly', 1, DATE_SUB(NOW(), INTERVAL 8 HOUR)),
('post_66', 'user_10', '["https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&w=600&h=1000', 'Temple run day! Bayon, Ta Prohm, and Angkor Wat all in one day!', 'Siem Reap', 7500, 580, 2100, 38000, 'siemreap_daily', 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=300&h=300', 'Siem Reap Daily', 0, DATE_SUB(NOW(), INTERVAL 10 HOUR)),
('post_67', 'user_4', '["https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&h=1000', 'Group outing with the TokLok creator team! Collaboration video coming soon!', 'Phnom Penh', 5100, 400, 1200, 21000, 'narith_vlog', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300', 'Narith Seng', 0, DATE_SUB(NOW(), INTERVAL 12 HOUR)),
('post_68', 'user_9', '["https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&h=1000', 'Kampot pepper ice cream! Yes it exists and it is amazing!', 'Kampot', 3200, 250, 600, 13000, 'kampot_pepper', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=300&h=300', 'Kampot Kitchen', 0, DATE_SUB(NOW(), INTERVAL 14 HOUR)),
('post_69', 'user_3', '["https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&h=1000', 'New laptop comparison! MacBook vs Windows for students in Cambodia', 'Phnom Penh', 1600, 120, 280, 6000, 'piseth_tech', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Piseth Khorn', 0, DATE_SUB(NOW(), INTERVAL 16 HOUR)),
('post_70', 'user_2', '["https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&h=1000', 'Num Pang (Cambodian sandwich) — the perfect street food lunch!', 'Phnom Penh', 2800, 190, 450, 10500, 'khmer_kitchen', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300', 'Chef Bopha', 1, DATE_SUB(NOW(), INTERVAL 18 HOUR)),
('post_71', 'user_6', '["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&h=1000', 'Ziplining through the rainforest! Adrenaline rush like no other!', 'Koh Kong', 2100, 160, 350, 8000, 'rithy_adventure', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300', 'Rithy Phal', 0, DATE_SUB(NOW(), INTERVAL 20 HOUR)),
('post_72', 'user_7', '["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&h=1000', 'Quick 5-minute makeup look for school! Easy and natural!', 'Phnom Penh', 3600, 280, 700, 14500, 'srey_makeup', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300', 'Srey Pov', 0, DATE_SUB(NOW(), INTERVAL 22 HOUR)),
('post_73', 'user_10', '["https://images.unsplash.com/photo-1508154048109-de55526b81a7?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1508154048109-de55526b81a7?auto=format&fit=crop&w=600&h=1000', 'Night market shopping in Siem Reap! Great deals on souvenirs!', 'Siem Reap', 3100, 230, 520, 12000, 'siemreap_daily', 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=300&h=300', 'Siem Reap Daily', 0, DATE_SUB(NOW(), INTERVAL 24 HOUR)),
('post_74', 'user_8', '["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&h=1000', 'Collaboration with other Khmer artists! Something special is coming!', 'Phnom Penh', 9100, 680, 3000, 48000, 'dara_music', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', 'Dara Sok', 1, DATE_SUB(NOW(), INTERVAL 26 HOUR)),
('post_75', 'user_4', '["https://images.unsplash.com/photo-1531747059667-7a8f0e76c5d6?auto=format&fit=crop&w=800&h=1200"]', 'https://images.unsplash.com/photo-1531747059667-7a8f0e76c5d6?auto=format&fit=crop&w=600&h=1000', 'Reacting to my old videos from 2020! So much has changed!', 'Phnom Penh', 4200, 340, 950, 18000, 'narith_vlog', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300', 'Narith Seng', 0, DATE_SUB(NOW(), INTERVAL 28 HOUR));

-- ============================================================
-- Add some likes from test user to populate feed experience
-- ============================================================
INSERT IGNORE INTO likes (id, user_id, post_id) VALUES
(UUID(), 'user_test', 'post_1'),
(UUID(), 'user_test', 'post_2'),
(UUID(), 'user_test', 'post_4'),
(UUID(), 'user_test', 'post_6'),
(UUID(), 'user_test', 'post_8'),
(UUID(), 'user_test', 'post_10'),
(UUID(), 'user_test', 'post_12'),
(UUID(), 'user_test', 'post_15'),
(UUID(), 'user_test', 'post_19'),
(UUID(), 'user_test', 'post_22'),
(UUID(), 'user_test', 'post_29'),
(UUID(), 'user_test', 'post_33'),
(UUID(), 'user_test', 'post_37'),
(UUID(), 'user_test', 'post_41'),
(UUID(), 'user_test', 'post_45'),
(UUID(), 'user_test', 'post_50'),
(UUID(), 'user_test', 'post_61'),
(UUID(), 'user_test', 'post_64'),
(UUID(), 'user_test', 'post_70'),
(UUID(), 'user_test', 'post_74');

-- ============================================================
-- Fill up follower/following counts on test user
-- ============================================================
INSERT IGNORE INTO follows (id, follower_id, following_id, status) VALUES
(UUID(), 'user_test', 'user_1', 'accepted'),
(UUID(), 'user_test', 'user_2', 'accepted'),
(UUID(), 'user_test', 'user_4', 'accepted'),
(UUID(), 'user_test', 'user_6', 'accepted'),
(UUID(), 'user_test', 'user_7', 'accepted'),
(UUID(), 'user_test', 'user_8', 'accepted'),
(UUID(), 'user_test', 'user_10', 'accepted'),
(UUID(), 'user_1', 'user_test', 'accepted'),
(UUID(), 'user_2', 'user_test', 'accepted'),
(UUID(), 'user_4', 'user_test', 'accepted');

-- ============================================================
-- Update some hashtag post counts for the new content
-- ============================================================
INSERT IGNORE INTO hashtags (id, tag, post_count) VALUES
('h16', 'CambodianFood', 12000),
('h17', 'PhnomPenhLife', 8500),
('h18', 'SiemReapGuide', 6700),
('h19', 'KohKong', 3400),
('h20', 'Mondulkiri', 2100),
('h21', 'Battambang', 5600);

-- ============================================================
-- DM test accounts: jamz@toklok.com and eash@toklok.com
-- Password for both: test1234
-- ============================================================
INSERT IGNORE INTO users (id, username, display_name, email, password, avatar_url, bio, is_verified, is_creator, follower_count, following_count, role) VALUES
('user_jamz', 'jamz', 'Jamz', 'jamz@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&h=300', 'Just vibing on TokLok', 0, 0, 320, 150, 'user'),
('user_eash', 'eash', 'Eash', 'eash@toklok.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&h=300', 'Chatting on TokLok', 0, 0, 280, 130, 'user');

-- Create conversation between jamz and eash
SET @conv_id = 'conv_jamz_eash';
INSERT IGNORE INTO conversations (id, created_at) VALUES
(@conv_id, DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT IGNORE INTO conversation_participants (id, conversation_id, user_id, last_read_at) VALUES
(UUID(), @conv_id, 'user_jamz', NOW()),
(UUID(), @conv_id, 'user_eash', NOW());

INSERT IGNORE INTO messages (id, conversation_id, sender_id, content, created_at) VALUES
('msg_01', @conv_id, 'user_jamz', 'Hey eash! How are you?', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('msg_02', @conv_id, 'user_eash', 'Hey Jamz! I am good, just checking out the new TokLok app. Its pretty cool!', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('msg_03', @conv_id, 'user_jamz', 'I know right! The feed is smooth and the posts are actually interesting', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('msg_04', @conv_id, 'user_eash', 'Have you seen the cooking videos from Kampot Kitchen? The pepper crab looks insane', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('msg_05', @conv_id, 'user_jamz', 'Yes! I tried making it at home. Did not turn out as good but it was still delicious LOL', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('msg_06', @conv_id, 'user_eash', 'Haha same here. Need to get the real Kampot pepper from the source', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('msg_07', @conv_id, 'user_jamz', 'We should plan a trip to Kampot. They have that pepper farm tour', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
('msg_08', @conv_id, 'user_eash', 'Definitely! And we can hit the durian festival too if we time it right', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
('msg_09', @conv_id, 'user_jamz', 'Bro I still cannot believe you like durian. That smell is criminal', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
('msg_10', @conv_id, 'user_eash', 'You just havent had the good one yet! Come on lets get some this weekend', DATE_SUB(NOW(), INTERVAL 6 HOUR)),
('msg_11', @conv_id, 'user_jamz', 'Alright fine. But if I throw up, you owe me a pizza', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('msg_12', @conv_id, 'user_eash', 'Deal! Pizza after durian. This is going to be legendary', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('msg_13', @conv_id, 'user_jamz', 'By the way, have you tried the explore feature? The leaderboard is wild', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('msg_14', @conv_id, 'user_eash', 'Yeah I saw that! Dara Music is killing it on the charts. That guy can sing', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('msg_15', @conv_id, 'user_jamz', 'For real. Anyway I gotta go, meeting up with some friends. Chat later!', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('msg_16', @conv_id, 'user_eash', 'See you! Test out the DM search too, its working now', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('msg_17', @conv_id, 'user_jamz', 'Will do. Peace!', NOW());

-- ============================================================
-- Let jamz and eash follow some creators for a populated feed
-- ============================================================
INSERT IGNORE INTO follows (id, follower_id, following_id, status) VALUES
(UUID(), 'user_jamz', 'user_1', 'accepted'),
(UUID(), 'user_jamz', 'user_2', 'accepted'),
(UUID(), 'user_jamz', 'user_8', 'accepted'),
(UUID(), 'user_jamz', 'user_eash', 'accepted'),
(UUID(), 'user_eash', 'user_1', 'accepted'),
(UUID(), 'user_eash', 'user_7', 'accepted'),
(UUID(), 'user_eash', 'user_8', 'accepted'),
(UUID(), 'user_eash', 'user_jamz', 'accepted');
