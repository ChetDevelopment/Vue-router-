import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { Notification } from '../types';
import { api, getToken } from '../api/client';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  readNotification: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  getUnreadCount: () => Promise<number>;
  acceptFollowRequest: (notificationId: string, actorId: string) => Promise<void>;
  declineFollowRequest: (notificationId: string, actorId: string) => Promise<void>;
  startPolling: () => () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isLoading: false,
      error: null,

      fetchNotifications: async () => {
        if (!getToken()) return;
        set({ isLoading: true, error: null });
        try {
          const notifs = await api.notifications.list();
          set((state) => {
            const localReadIds = new Set(state.notifications.filter(n => n.isRead).map(n => n.id));
            return {
              notifications: (notifs || []).map((n: any) => ({
                ...n,
                isRead: n.isRead || localReadIds.has(n.id),
              })),
              isLoading: false,
            };
          });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      readNotification: async (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        }));
        try {
          await api.notifications.markRead(id);
        } catch (e: any) {
          set({ error: e.message });
          // Rollback on failure
          set((state) => ({
            notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
          }));
        }
      },

      markAllNotificationsRead: async () => {
        const prev = get().notifications;
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
        try {
          await api.notifications.markAllRead();
        } catch (e: any) {
          set({ error: e.message, notifications: prev });
        }
      },

      getUnreadCount: async () => {
        try {
          const res = await api.notifications.unreadCount();
          return res.count || 0;
        } catch {
          return get().notifications.filter((n) => !n.isRead).length;
        }
      },

      acceptFollowRequest: async (notificationId, actorId) => {
        // Optimistically mark notification read
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
        }));
        try {
          // Approve the follow request
          await api.users.approveFollowRequest(actorId);
          // Mark notification as read
          await api.notifications.markRead(notificationId);
        } catch (e: any) {
          set({ error: e.message });
          // Rollback
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: false } : n
            ),
          }));
        }
      },

      declineFollowRequest: async (notificationId, actorId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
        }));
        try {
          await api.users.declineFollowRequest(actorId);
          await api.notifications.markRead(notificationId);
        } catch (e: any) {
          set({ error: e.message });
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: false } : n
            ),
          }));
        }
      },

      startPolling: () => {
        let interval: ReturnType<typeof setInterval> | null = null;
        let appStateSubscription: any = null;

        const startInterval = () => {
          if (interval) clearInterval(interval);
          interval = setInterval(() => {
            get().fetchNotifications();
          }, 30000);
        };

        const handleAppState = (nextState: AppStateStatus) => {
          if (nextState === 'active') {
            get().fetchNotifications();
            startInterval();
          } else {
            if (interval) { clearInterval(interval); interval = null; }
          }
        };

        startInterval();
        appStateSubscription = AppState.addEventListener('change', handleAppState);

        return () => {
          if (interval) clearInterval(interval);
          appStateSubscription?.remove();
        };
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);
