export type UserRole = 'guest' | 'user' | 'creator' | 'moderator' | 'admin';
export type PostType = 'video' | 'photo' | 'carousel';
export type PostVisibility = 'public' | 'followers' | 'private';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned';
export type ReportTargetType = 'post' | 'comment' | 'user';
export type NotificationType = 'follow' | 'follow_request' | 'like' | 'comment' | 'mention' | 'system' | 'gift' | 'remix';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  avatarUrl: string;
  bio: string;
  link?: string;
  isPrivate: boolean;
  isCreator: boolean;
  isVerified: boolean;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  totalLikesReceived: number;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  userDisplayName: string;
  isUserVerified: boolean;
  type: PostType;
  mediaUrls: string[];
  coverThumbnailUrl: string;
  caption: string;
  locationTag?: string;
  visibility: PostVisibility;
  commentsEnabled: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  isLikedByUser?: boolean;
  isBookmarkedByUser?: boolean;
  isFollowingCreator?: boolean;
  remixOfPostId?: string;
  remixOfUsername?: string;
  soundId?: string;
  soundName?: string;
  soundCreator?: string;
  isDuetAllowed?: boolean;
  isStitchAllowed?: boolean;
  duetOfPostId?: string;
  duetOfUsername?: string;
  stitchOfPostId?: string;
  stitchOfUsername?: string;
  stitchCutDuration?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  userDisplayName: string;
  content: string;
  likeCount: number;
  createdAt: string;
  isLikedByUser?: boolean;
  parentCommentId?: string | null;
  replies?: Comment[];
}

export interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetType: ReportTargetType;
  targetId: string;
  targetExcerpt?: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  actorUsername: string;
  actorAvatar: string;
  type: NotificationType;
  targetId?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Hashtag {
  id: string;
  tag: string;
  postCount: number;
}

export interface CreatorAnalytics {
  viewsOverTime: { date: string; value: number }[];
  likesOverTime: { date: string; value: number }[];
  commentsOverTime: { date: string; value: number }[];
  followersGrowth: { date: string; value: number }[];
}

export interface SoundTrack {
  id: string;
  title: string;
  creator: string;
  duration: string;
  category: string;
}

export interface VisualFilter {
  id: string;
  name: string;
  style: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  color: string;
  logoBg: string;
  badge: string;
  description: string;
}

export interface PresetAmount {
  riel: number;
  usd: number;
  label: string;
  icon: string;
}

export interface Playlist {
  id: string;
  name: string;
  emoji: string;
  postIds: string[];
}

export interface ReportAction {
  id: string;
  target: string;
  action: string;
  time: string;
}
