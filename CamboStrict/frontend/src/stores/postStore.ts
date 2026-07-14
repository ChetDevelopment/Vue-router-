import { create } from 'zustand';
import { Post, Comment, Report, Notification } from '../types';
import {
  INITIAL_POSTS,
  INITIAL_COMMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_REPORTS,
} from '../constants/data';

interface PostState {
  posts: Post[];
  comments: Comment[];
  notifications: Notification[];
  reports: Report[];
  feedType: 'explore' | 'following';
  setFeedType: (type: 'explore' | 'following') => void;
  likePost: (postId: string) => void;
  bookmarkPost: (postId: string) => void;
  followCreator: (creatorId: string, isPrivate: boolean) => void;
  addComment: (postId: string, comment: Comment, isOwnPost: boolean) => void;
  likeComment: (commentId: string, parentCommentId: string | null) => void;
  submitReport: (report: Report) => void;
  publishPost: (post: Post) => void;
  removePost: (postId: string) => void;
  actionReport: (reportId: string) => void;
  readNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Notification) => void;
}

export const usePostStore = create<PostState>((set) => ({
  posts: INITIAL_POSTS,
  comments: INITIAL_COMMENTS,
  notifications: INITIAL_NOTIFICATIONS,
  reports: INITIAL_REPORTS,
  feedType: 'explore',

  setFeedType: (type) => set({ feedType: type }),

  likePost: (postId) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, isLikedByUser: !p.isLikedByUser, likeCount: p.isLikedByUser ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      ),
    })),

  bookmarkPost: (postId) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, isBookmarkedByUser: !p.isBookmarkedByUser } : p
      ),
    })),

  followCreator: (creatorId, isPrivate) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.userId === creatorId ? { ...p, isFollowingCreator: !p.isFollowingCreator } : p
      ),
    })),

  addComment: (postId, comment, isOwnPost) =>
    set((state) => {
      const updatedComments = comment.parentCommentId
        ? state.comments.map((c) =>
            c.id === comment.parentCommentId
              ? { ...c, replies: [...(c.replies || []), comment] }
              : c
          )
        : [...state.comments, comment];

      return {
        comments: updatedComments,
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
        ),
      };
    }),

  likeComment: (commentId, parentCommentId) =>
    set((state) => ({
      comments: parentCommentId
        ? state.comments.map((c) =>
            c.id === parentCommentId
              ? {
                  ...c,
                  replies: (c.replies || []).map((r) =>
                    r.id === commentId
                      ? { ...r, isLikedByUser: !r.isLikedByUser, likeCount: r.isLikedByUser ? r.likeCount - 1 : r.likeCount + 1 }
                      : r
                  ),
                }
              : c
          )
        : state.comments.map((c) =>
            c.id === commentId
              ? { ...c, isLikedByUser: !c.isLikedByUser, likeCount: c.isLikedByUser ? c.likeCount - 1 : c.likeCount + 1 }
              : c
          ),
    })),

  submitReport: (report) =>
    set((state) => ({
      reports: [report, ...state.reports],
      posts: state.posts.filter((p) => p.id !== report.targetId),
    })),

  publishPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),

  removePost: (postId) =>
    set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) })),

  actionReport: (reportId) =>
    set((state) => ({ reports: state.reports.filter((r) => r.id !== reportId) })),

  readNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),

  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
}));
