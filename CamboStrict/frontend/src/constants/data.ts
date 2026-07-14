import { User, Post, Comment, Notification, Report, Hashtag } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_1', username: 'sokha_travels', displayName: 'Sokha Ly',
    email: 'sokha@toklok.kh', phone: '+855 12 345 678',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300',
    bio: 'Exploring the hidden gems of Cambodia | Travel photographer | Siem Reap based',
    link: 'sokhalytravel.com', isPrivate: false, isCreator: true, isVerified: true,
    role: 'creator', status: 'active', createdAt: '2026-01-15T08:00:00Z',
    followerCount: 24500, followingCount: 420, totalLikesReceived: 189000
  },
  {
    id: 'user_2', username: 'khmer_kitchen', displayName: 'Chef Bopha',
    email: 'bopha@khmerkitchen.com', phone: '+855 88 765 4321',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300',
    bio: 'Authentic Cambodian recipes passed down through generations. Cook with love!',
    link: 'khmerkitchen.org', isPrivate: false, isCreator: true, isVerified: true,
    role: 'creator', status: 'active', createdAt: '2026-02-10T12:00:00Z',
    followerCount: 48900, followingCount: 150, totalLikesReceived: 342000
  },
  {
    id: 'user_3', username: 'piseth_tech', displayName: 'Piseth Khorn',
    email: 'piseth@techkh.com', phone: '+855 15 999 888',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300',
    bio: 'Tech reviewer in Phnom Penh. Making technology simple for everyone.',
    isPrivate: false, isCreator: false, isVerified: false,
    role: 'user', status: 'active', createdAt: '2026-03-01T09:30:00Z',
    followerCount: 1200, followingCount: 310, totalLikesReceived: 4500
  },
  {
    id: 'user_4', username: 'apsara_dance_school', displayName: 'Apsara Arts Cambodia',
    email: 'info@apsaradance.org',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&h=300',
    bio: 'Preserving and sharing the beauty of classical Khmer dance.',
    link: 'apsaraartscambodia.org', isPrivate: true, isCreator: true, isVerified: true,
    role: 'creator', status: 'active', createdAt: '2025-11-20T04:15:00Z',
    followerCount: 15300, followingCount: 88, totalLikesReceived: 98000
  },
  {
    id: 'user_5', username: 'narith_vlog', displayName: 'Narith Seng',
    email: 'narith@toklok.kh', phone: '+855 92 111 222',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300',
    bio: 'Vlogger based in Phnom Penh. Making people smile every day!',
    isPrivate: false, isCreator: false, isVerified: false,
    role: 'user', status: 'active', createdAt: '2026-04-12T14:20:00Z',
    followerCount: 3500, followingCount: 820, totalLikesReceived: 12000
  },
  {
    id: 'user_admin', username: 'toklok_moderator', displayName: 'TokLok Safety',
    email: 'moderator@toklok.kh',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300',
    bio: 'Official Safety and Community Moderation account for TokLok Cambodia.',
    isPrivate: false, isCreator: false, isVerified: true,
    role: 'moderator', status: 'active', createdAt: '2025-10-01T00:00:00Z',
    followerCount: 150000, followingCount: 5, totalLikesReceived: 0
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post_1', userId: 'user_1', username: 'sokha_travels',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300',
    userDisplayName: 'Sokha Ly', isUserVerified: true, type: 'video',
    mediaUrls: ['https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4'],
    coverThumbnailUrl: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=600&h=1000',
    caption: 'Magical morning hike in Phnom Kulen National Park! The waterfalls are absolutely roaring today! Siem Reap is full of surprises!',
    locationTag: 'Phnom Kulen, Siem Reap', visibility: 'public', commentsEnabled: true,
    likeCount: 1845, commentCount: 124, shareCount: 432, createdAt: '2026-07-12T10:30:00-07:00',
    isLikedByUser: false, isBookmarkedByUser: false, isFollowingCreator: false
  },
  {
    id: 'post_2', userId: 'user_2', username: 'khmer_kitchen',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300',
    userDisplayName: 'Chef Bopha', isUserVerified: true, type: 'video',
    mediaUrls: ['https://assets.mixkit.co/videos/preview/mixkit-serving-traditional-cambodian-food-48749-large.mp4'],
    coverThumbnailUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&h=1000',
    caption: 'Cooking the ultimate Fish Amok today! Steamed in banana leaves with fresh local lemongrass paste, turmeric, and creamy coconut milk!',
    locationTag: 'Phnom Penh, Cambodia', visibility: 'public', commentsEnabled: true,
    likeCount: 4290, commentCount: 312, shareCount: 1205, createdAt: '2026-07-13T12:15:00-07:00',
    isLikedByUser: true, isBookmarkedByUser: false, isFollowingCreator: true
  },
  {
    id: 'post_3', userId: 'user_4', username: 'apsara_dance_school',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&h=300',
    userDisplayName: 'Apsara Arts Cambodia', isUserVerified: true, type: 'photo',
    mediaUrls: ['https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=800&h=1200'],
    coverThumbnailUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=600&h=1000',
    caption: 'The elegance of the Robam Tep Apsara (Apsara Dance). Each slow hand gesture tells a sacred story dating back to the Angkorian era.',
    locationTag: 'National Museum of Cambodia, Phnom Penh', visibility: 'public', commentsEnabled: true,
    likeCount: 3102, commentCount: 185, shareCount: 840, createdAt: '2026-07-11T09:00:00-07:00',
    isLikedByUser: false, isBookmarkedByUser: true, isFollowingCreator: false
  },
  {
    id: 'post_4', userId: 'user_3', username: 'piseth_tech',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300',
    userDisplayName: 'Piseth Khorn', isUserVerified: false, type: 'carousel',
    mediaUrls: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&h=1000',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&h=1000',
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&h=1000'
    ],
    coverThumbnailUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&h=1000',
    caption: 'My full review of the newest budget phone. Is it worth 180$ for gamers in Cambodia?',
    locationTag: 'Battambang, Cambodia', visibility: 'public', commentsEnabled: true,
    likeCount: 524, commentCount: 68, shareCount: 110, createdAt: '2026-07-13T14:45:00-07:00',
    isLikedByUser: false, isBookmarkedByUser: false, isFollowingCreator: false
  },
  {
    id: 'post_5', userId: 'user_5', username: 'narith_vlog',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300',
    userDisplayName: 'Narith Seng', isUserVerified: false, type: 'video',
    mediaUrls: ['https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lit-room-scrolling-phone-41914-large.mp4'],
    coverThumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&h=1000',
    caption: 'Trying to order coffee in Khmer with 0 hours of sleep vs 8 hours of sleep. Absolute disaster!',
    locationTag: 'Brown Coffee, Phnom Penh', visibility: 'public', commentsEnabled: true,
    likeCount: 981, commentCount: 43, shareCount: 220, createdAt: '2026-07-13T16:20:00-07:00',
    isLikedByUser: false, isBookmarkedByUser: false, isFollowingCreator: false
  },
  {
    id: 'post_6', userId: 'user_1', username: 'sokha_travels',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300',
    userDisplayName: 'Sokha Ly', isUserVerified: true, type: 'photo',
    mediaUrls: ['https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&h=1200'],
    coverThumbnailUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&h=1000',
    caption: 'Phnom Penh skyline at sunset from the penthouse view. The Mekong River looks so golden!',
    locationTag: 'Koh Pich, Phnom Penh', visibility: 'public', commentsEnabled: true,
    likeCount: 1530, commentCount: 92, shareCount: 204, createdAt: '2026-07-10T18:15:00-07:00',
    isLikedByUser: false, isBookmarkedByUser: false, isFollowingCreator: false
  }
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comm_1', postId: 'post_2', userId: 'user_1', username: 'sokha_travels',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300',
    userDisplayName: 'Sokha Ly',
    content: 'OMG! Fish Amok is my absolute favorite. Your lemongrass paste looks so fresh!',
    likeCount: 42, createdAt: '2026-07-13T12:30:00-07:00', isLikedByUser: true,
    parentCommentId: null,
    replies: [
      {
        id: 'comm_1_r1', postId: 'post_2', userId: 'user_2', username: 'khmer_kitchen',
        userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&h=300',
        userDisplayName: 'Chef Bopha',
        content: 'Thank you Sokha! Main secret is using real fresh wild ginger (Kcheay)!',
        likeCount: 15, createdAt: '2026-07-13T12:45:00-07:00', isLikedByUser: false,
        parentCommentId: 'comm_1'
      }
    ]
  },
  {
    id: 'comm_2', postId: 'post_2', userId: 'user_3', username: 'piseth_tech',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300',
    userDisplayName: 'Piseth Khorn',
    content: 'Wow, this looks restaurant quality! Is it difficult to find the noni leaves outside Phnom Penh?',
    likeCount: 8, createdAt: '2026-07-13T13:00:00-07:00', parentCommentId: null, replies: []
  },
  {
    id: 'comm_3', postId: 'post_1', userId: 'user_5', username: 'narith_vlog',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300',
    userDisplayName: 'Narith Seng',
    content: 'Kulen mountain is amazing! Did you swim in the river of a thousand lingas?',
    likeCount: 14, createdAt: '2026-07-12T11:00:00-07:00', parentCommentId: null, replies: []
  }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'notif_1', userId: 'user_2', actorId: 'user_1', actorUsername: 'sokha_travels', actorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&h=300', type: 'comment', targetId: 'post_2', isRead: false, createdAt: '2026-07-13T12:30:00-07:00' },
  { id: 'notif_2', userId: 'user_2', actorId: 'user_3', actorUsername: 'piseth_tech', actorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300', type: 'like', targetId: 'post_2', isRead: false, createdAt: '2026-07-13T12:10:00-07:00' },
  { id: 'notif_3', userId: 'user_2', actorId: 'user_5', actorUsername: 'narith_vlog', actorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&h=300', type: 'follow', isRead: true, createdAt: '2026-07-13T08:00:00-07:00' },
  { id: 'notif_system_welcome', userId: 'user_2', actorId: 'user_admin', actorUsername: 'toklok_moderator', actorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&h=300', type: 'system', message: 'Welcome to TokLok Cambodia! Your profile has been unlocked for Creator Status.', isRead: false, createdAt: '2026-07-13T18:00:00-07:00' }
];

export const INITIAL_REPORTS: Report[] = [
  { id: 'rep_1', reporterId: 'user_3', reporterUsername: 'piseth_tech', targetType: 'post', targetId: 'post_5', targetExcerpt: 'Trying to order coffee in Khmer with 0 hours of sleep vs 8 hours...', reason: 'spam', status: 'pending', createdAt: '2026-07-13T17:15:00-07:00' }
];

export const TRENDING_HASHTAGS: Hashtag[] = [
  { id: 'h1', tag: 'AngkorWat', postCount: 145000 },
  { id: 'h2', tag: 'KhmerFood', postCount: 98400 },
  { id: 'h3', tag: 'PhnomPenh', postCount: 121000 },
  { id: 'h4', tag: 'Amok', postCount: 45000 },
  { id: 'h5', tag: 'Apsara', postCount: 32000 },
  { id: 'h6', tag: 'SiemReap', postCount: 88900 },
  { id: 'h7', tag: 'Sihanoukville', postCount: 54100 },
  { id: 'h8', tag: 'Cambodia', postCount: 324000 }
];

export const INTEREST_CATEGORIES = [
  { id: 'travel', label: 'Travel & Nature', icon: 'Compass' },
  { id: 'food', label: 'Khmer Cooking & Food', icon: 'Utensils' },
  { id: 'dance', label: 'Khmer Culture & Art', icon: 'Music' },
  { id: 'tech', label: 'Tech & Gadgets Reviews', icon: 'Smartphone' },
  { id: 'comedy', label: 'Humor & Comedy Vlogs', icon: 'Smile' },
  { id: 'gaming', label: 'Mobile Gaming', icon: 'Gamepad2' },
  { id: 'music', label: 'Khmer Pop & Remixes', icon: 'Headphones' },
  { id: 'fashion', label: 'Cambodia Fashion & Style', icon: 'Sparkles' }
];

export const MOCK_ANALYTICS = {
  viewsOverTime: [
    { date: 'Mon', value: 1200 }, { date: 'Tue', value: 1500 },
    { date: 'Wed', value: 1800 }, { date: 'Thu', value: 2400 },
    { date: 'Fri', value: 3100 }, { date: 'Sat', value: 4500 },
    { date: 'Sun', value: 5200 }
  ],
  likesOverTime: [
    { date: 'Mon', value: 240 }, { date: 'Tue', value: 310 },
    { date: 'Wed', value: 420 }, { date: 'Thu', value: 510 },
    { date: 'Fri', value: 720 }, { date: 'Sat', value: 980 },
    { date: 'Sun', value: 1200 }
  ],
  commentsOverTime: [
    { date: 'Mon', value: 12 }, { date: 'Tue', value: 18 },
    { date: 'Wed', value: 24 }, { date: 'Thu', value: 35 },
    { date: 'Fri', value: 48 }, { date: 'Sat', value: 75 },
    { date: 'Sun', value: 92 }
  ],
  followersGrowth: [
    { date: 'Mon', value: 48100 }, { date: 'Tue', value: 48220 },
    { date: 'Wed', value: 48350 }, { date: 'Thu', value: 48510 },
    { date: 'Fri', value: 48680 }, { date: 'Sat', value: 48820 },
    { date: 'Sun', value: 48900 }
  ]
};

export const TRENDING_SOUNDS = [
  { id: 'remix2026', title: 'Khmer Remix 2026 (Trending)', creator: 'DJ Sabay', duration: '0:15', category: 'Dance' },
  { id: 'acoustic', title: 'Siem Reap Acoustic Guitar', creator: 'Dara & Socheata', duration: '0:15', category: 'Acoustic' },
  { id: 'mekong', title: 'Mekong River Sunset Traditional', creator: 'Traditional Fusion', duration: '0:15', category: 'Instrumental' },
  { id: 'apsara', title: 'Apsara Classical Dance Pinpeat', creator: 'Royal Ballet Club', duration: '0:15', category: 'Classical' },
  { id: 'phnompenh', title: 'Phnom Penh Rhythm (Vibe)', creator: 'K-Star Cambodia', duration: '0:15', category: 'Hip-Hop' },
  { id: 'choksar', title: 'Chok Sar Folk Beats', creator: 'Sabay Folk Club', duration: '0:15', category: 'Folk' },
  { id: 'romance', title: 'Bong Sra-lanh Oun', creator: 'Pop Romance Collective', duration: '0:15', category: 'Pop' },
  { id: 'cardamom', title: 'Cardamom Ambient Rain', creator: 'Nature Sounds KH', duration: '0:15', category: 'Ambient' }
];

export const PAYMENT_PROVIDERS = [
  { id: 'aba', name: 'ABA Pay', color: '#005C9E', logoBg: '#063D6F', badge: 'KHQR: ABA instant QR', description: 'Pay instantly via ABA Mobile App' },
  { id: 'wing', name: 'Wing Bank', color: '#8CC63F', logoBg: '#7BB835', badge: 'Wing Pay', description: 'Fast transfers via Wing Money app' },
  { id: 'acleda', name: 'ACLEDA ToanChet', color: '#D3A855', logoBg: '#A88034', badge: 'ACLEDA bank-to-bank', description: 'Secure local ACLEDA QR scan' },
  { id: 'pipay', name: 'Pi Pay', color: '#E83D8E', logoBg: '#C52070', badge: 'Pi Pay Wallet', description: 'Modern Cambodian digital wallet' }
];

export const PRESET_AMOUNTS = [
  { riel: 2000, usd: 0.5, label: 'Cup of Iced Coffee', icon: '☕' },
  { riel: 10000, usd: 2.5, label: 'Delicious Kuy Teav', icon: '🍜' },
  { riel: 40000, usd: 10, label: 'Chef Bopha Special', icon: '🍲' },
  { riel: 100000, usd: 25, label: 'Creator Mega Support', icon: '🚀' }
];

export const KHMER_CHIPS = [
  "ល្អណាស់!", "ពិរោះណាស់", "ឃ្លានណាស់", "គាំទ្រពេញទំហឹង!",
  "ស្អាតខ្លាំងណាស់", "អរគុណច្រើនបង", "សំណាងល្អ", "សប្បាយណាស់"
];

export const PRESET_LOCATIONS = [
  'Phnom Penh', 'Siem Reap', 'Kampot', 'Sihanoukville', 'Battambang', 'Mondulkiri'
];
