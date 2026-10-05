import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post } from '../types';
import { api, getToken } from '../api/client';
import { useAuthStore } from './authStore';

interface PostState {
  posts: Post[];
  feedType: 'explore' | 'following' | 'nearby';
  isLoading: boolean;
  error: string | null;
  totalPosts: number;
  hasMore: boolean;
  trendingHashtags: { id: string; tag: string; postCount: number }[];
  setFeedType: (type: 'explore' | 'following' | 'nearby') => void;
  fetchPosts: (page?: number, feedType?: string) => Promise<void>;
  fetchPost: (id: string) => Promise<Post | null>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;
  unbookmarkPost: (postId: string) => Promise<void>;
  followCreator: (creatorId: string) => Promise<void>;
  unfollowCreator: (creatorId: string) => Promise<void>;
  publishPost: (formData: FormData) => Promise<void>;
  removePost: (postId: string) => Promise<void>;
  editPost: (postId: string, updates: Record<string, any>) => Promise<void>;
  archivePost: (postId: string) => Promise<void>;
  fetchTrendingHashtags: () => Promise<void>;
  fetchSuggestedUsers: () => Promise<any[]>;
  repostPost: (postId: string) => Promise<void>;
  removeRepost: (postId: string) => Promise<void>;
  searchPosts: (q: string) => Promise<Post[]>;
  searchUsers: (q: string) => Promise<any[]>;
  getFollowers: (userId: string) => Promise<any[]>;
  getFollowing: (userId: string) => Promise<any[]>;
  getUser: (userId: string) => Promise<any>;
}

export const usePostStore = create<PostState>()(
  persist(
    (set, get) => ({
      posts: [],
      feedType: 'explore',
      isLoading: false,
      error: null,
      totalPosts: 0,
      hasMore: true,
      trendingHashtags: [],

      setFeedType: (type) => set({ feedType: type }),

      fetchPosts: async (page = 1, feedType?: string) => {
        set({ isLoading: true, error: null });
        try {
          const limit = feedType === 'following' ? 10 : 20;
          const res = feedType === 'following'
            ? await api.posts.feed('following', page)
            : await api.posts.list(page, limit);
          const newPosts = res.posts || [];
          set((state) => {
            const merged = page === 1 ? newPosts : [...state.posts, ...newPosts];
            const seen = new Set<string>();
            const deduped = merged.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
            return {
              posts: deduped,
              totalPosts: res.total || 0,
              hasMore: newPosts.length === limit,
              isLoading: false,
            };
          });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      fetchPost: async (id) => {
        try {
          const post = await api.posts.get(id);
          return post;
        } catch {
          return null;
        }
      },

      likePost: async (postId) => {
        const prev = get().posts.find(p => p.id === postId);
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, isLikedByUser: true, likeCount: p.likeCount + 1 } : p
          ),
        }));
        try {
          await api.posts.like(postId);
        } catch (e: any) {
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId ? { ...p, isLikedByUser: prev?.isLikedByUser || false, likeCount: prev?.likeCount || 0 } : p
            ),
          }));
          set({ error: e.message });
        }
      },

      unlikePost: async (postId) => {
        const prev = get().posts.find(p => p.id === postId);
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, isLikedByUser: false, likeCount: Math.max(0, p.likeCount - 1) } : p
          ),
        }));
        try {
          await api.posts.unlike(postId);
        } catch (e: any) {
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId ? { ...p, isLikedByUser: prev?.isLikedByUser || false, likeCount: prev?.likeCount || 0 } : p
            ),
          }));
          set({ error: e.message });
        }
      },

      bookmarkPost: async (postId) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, isBookmarkedByUser: true } : p
          ),
        }));
        try {
          await api.posts.bookmark(postId);
        } catch (e: any) {
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId ? { ...p, isBookmarkedByUser: false } : p
            ),
          }));
          set({ error: e.message });
        }
      },

      unbookmarkPost: async (postId) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, isBookmarkedByUser: false } : p
          ),
        }));
        try {
          await api.posts.unbookmark(postId);
        } catch (e: any) {
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId ? { ...p, isBookmarkedByUser: true } : p
            ),
          }));
          set({ error: e.message });
        }
      },

      followCreator: async (creatorId) => {
        const prevMap = new Map<string, boolean>();
        get().posts.filter(p => p.userId === creatorId).forEach(p => prevMap.set(p.id, p.isFollowingCreator || false));
        set((state) => ({
          posts: state.posts.map((p) =>
            p.userId === creatorId ? { ...p, isFollowingCreator: true } : p
          ),
        }));
        try {
          await api.users.follow(creatorId);
          const authState = useAuthStore.getState();
          if (authState.currentUser) {
            useAuthStore.setState({
              currentUser: { ...authState.currentUser, followingCount: authState.currentUser.followingCount + 1 }
            });
          }
        } catch (e: any) {
          set((state) => ({
            posts: state.posts.map((p) =>
              p.userId === creatorId ? { ...p, isFollowingCreator: prevMap.get(p.id) || false } : p
            ),
          }));
          set({ error: e.message });
        }
      },

      unfollowCreator: async (creatorId) => {
        const prevMap = new Map<string, boolean>();
        get().posts.filter(p => p.userId === creatorId).forEach(p => prevMap.set(p.id, p.isFollowingCreator || false));
        set((state) => ({
          posts: state.posts.map((p) =>
            p.userId === creatorId ? { ...p, isFollowingCreator: false } : p
          ),
        }));
        try {
          await api.users.unfollow(creatorId);
          const authState = useAuthStore.getState();
          if (authState.currentUser && authState.currentUser.followingCount > 0) {
            useAuthStore.setState({
              currentUser: { ...authState.currentUser, followingCount: authState.currentUser.followingCount - 1 }
            });
          }
        } catch (e: any) {
          set((state) => ({
            posts: state.posts.map((p) =>
              p.userId === creatorId ? { ...p, isFollowingCreator: prevMap.get(p.id) || false } : p
            ),
          }));
          set({ error: e.message });
        }
      },

      repostPost: async (postId) => {
        const prev = get().posts.find(p => p.id === postId)?.shareCount ?? 0;
        set((state) => ({
          posts: state.posts.map((p) => p.id === postId ? { ...p, shareCount: p.shareCount + 1 } : p),
        }));
        try {
          await api.postsRelationships.repost(postId);
        } catch (e: any) {
          set((state) => ({
            posts: state.posts.map((p) => p.id === postId ? { ...p, shareCount: prev } : p),
          }));
          set({ error: e.message });
          throw e;
        }
      },

      removeRepost: async (postId) => {
        const prev = get().posts.find(p => p.id === postId)?.shareCount ?? 0;
        set((state) => ({
          posts: state.posts.map((p) => p.id === postId ? { ...p, shareCount: Math.max(0, p.shareCount - 1) } : p),
        }));
        try {
          await api.postsRelationships.removeRepost(postId);
        } catch (e: any) {
          set((state) => ({
            posts: state.posts.map((p) => p.id === postId ? { ...p, shareCount: prev } : p),
          }));
          set({ error: e.message });
        }
      },

      publishPost: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const post = await api.posts.create(formData);
          set((state) => ({ posts: [post, ...state.posts], isLoading: false }));
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        }
      },

      removePost: async (postId) => {
        try {
          await api.posts.delete(postId);
          set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) }));
        } catch (e: any) {
          set({ error: e.message });
          throw e;
        }
      },

      editPost: async (postId, updates) => {
        try {
          const updated = await api.posts.update(postId, updates);
          set((state) => ({
            posts: state.posts.map((p) => (p.id === postId ? { ...p, ...updated } : p)),
          }));
        } catch (e: any) {
          set({ error: e.message });
          throw e;
        }
      },

      archivePost: async (postId) => {
        try {
          const post = get().posts.find(p => p.id === postId);
          if (post) {
            await api.posts.update(postId, { isArchived: !post.isArchived });
            set((state) => ({
              posts: state.posts.map((p) =>
                p.id === postId ? { ...p, isArchived: !p.isArchived } : p
              ),
            }));
          }
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      fetchTrendingHashtags: async () => {
        try {
          const tags = await api.posts.hashtagsTrending();
          set({ trendingHashtags: tags || [] });
        } catch (e) { console.error(e); }
      },

      fetchSuggestedUsers: async () => {
        try {
          return await api.users.suggested() || [];
        } catch {
          return [];
        }
      },

      searchPosts: async (q) => {
        try {
          return await api.posts.search(q) || [];
        } catch {
          return [];
        }
      },

      searchUsers: async (q) => {
        try {
          return await api.users.search(q) || [];
        } catch {
          return [];
        }
      },

      getFollowers: async (userId) => {
        try {
          return await api.users.followers(userId) || [];
        } catch {
          return [];
        }
      },

      getFollowing: async (userId) => {
        try {
          return await api.users.following(userId) || [];
        } catch {
          return [];
        }
      },

      getUser: async (userId) => {
        try {
          return await api.users.get(userId);
        } catch {
          return null;
        }
      },
    }),
    {
      name: 'post-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        feedType: state.feedType,
      }),
    }
  )
);
