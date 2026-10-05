import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { api, setToken, loadToken } from '../api/client';
import { Platform } from 'react-native';
import { useOfflineStore } from './offlineStore';

async function registerPushToken() {
  if (Platform.OS === 'web') return;
  try {
    const ExpoNotif: any = await import('expo-notifications');
    const { status } = await ExpoNotif.requestPermissionsAsync();
    if (status !== 'granted') return;
    const { getValidProjectId } = await import('../utils/pushToken');
    const projectId = getValidProjectId();
    if (!projectId) return;
    const tokenData = await ExpoNotif.getExpoPushTokenAsync({ projectId });
    if (tokenData.data) {
      await api.push.register(tokenData.data, Platform.OS);
    }
  } catch (e) { console.error(e); }
}

interface AuthState {
  currentUser: User | null;
  blockedUsers: string[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  signup: (data: { username: string; displayName: string; email?: string; phone?: string; password: string }) => Promise<void>;
  login: (data: { login: string; password: string }) => Promise<void>;
  updateProfile: (fields: Partial<User>) => Promise<void>;
  updateRole: (role: UserRole) => void;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      blockedUsers: [],
      isLoading: false,
      error: null,
      isInitialized: false,

      initialize: async () => {
        await loadToken();
        const { getToken, getRefreshToken } = await import('../api/client');
        const token = getToken();
        const refreshTok = getRefreshToken();

        if (token) {
          try {
            const res = await api.auth.me();
            set({ currentUser: res.user, isInitialized: true });
            return;
          } catch (e) { console.warn('Session restore via /me failed', e); }
        }

        // Try to refresh the session using refresh token
        if (refreshTok) {
          try {
            const refreshRes = await api.auth.refresh(refreshTok);
            if (refreshRes.token) {
              setToken(refreshRes.token, refreshRes.refreshToken || null);
              const res = await api.auth.me();
              set({ currentUser: res.user, isInitialized: true });
              return;
            }
          } catch (e) { console.warn('Session refresh failed', e); }
        }

        setToken(null, null);
        set({ currentUser: null, isInitialized: true });
      },

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      signup: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.auth.signup(data);
          setToken(res.token, res.refreshToken || null);
          set({ currentUser: res.user, isLoading: false });
          // Register push token
          registerPushToken().catch(() => {});
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        }
      },

      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.auth.login(data);
          setToken(res.token, res.refreshToken || null);
          set({ currentUser: res.user, isLoading: false });
          // Register push token
          registerPushToken().catch(() => {});
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        }
      },

      updateProfile: async (fields) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await api.users.update(fields);
          set({ currentUser: updated, isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
          throw e;
        }
      },

      updateRole: async (role) => {
        const state = useAuthStore.getState();
        if (!state.currentUser) return;
        if ((role === 'admin' || role === 'moderator') && state.currentUser.role !== 'admin' && state.currentUser.role !== 'moderator') {
          return;
        }
        try {
          await api.users.update({ role, isCreator: role === 'creator' });
          set({
            currentUser: { ...state.currentUser, role, isCreator: role === 'creator' ? true : state.currentUser.isCreator },
          });
        } catch (e: any) {
          set({ error: e.message });
        }
      },

      blockUser: async (userId) => {
        try {
          await api.users.block(userId);
          set((state) => ({ blockedUsers: [...state.blockedUsers, userId] }));
        } catch (e: any) {
          set({ error: e.message });
          throw e;
        }
      },

      unblockUser: async (userId) => {
        try {
          await api.users.unblock(userId);
          set((state) => ({ blockedUsers: state.blockedUsers.filter((id) => id !== userId) }));
        } catch (e: any) {
          set({ error: e.message });
          throw e;
        }
      },

      refreshSession: async () => {
        try {
          const res = await api.auth.me();
          set({ currentUser: res.user });
        } catch {
          setToken(null);
          set({ currentUser: null });
        }
      },

      logout: async () => {
        try {
          const { getToken, getRefreshToken } = await import('../api/client');
          // Unregister push token before logout
          try {
            const ExpoNotif: any = await import('expo-notifications');
            const { getValidProjectId } = await import('../utils/pushToken');
            const projectId = getValidProjectId();
            if (projectId) {
              const tokenData = await ExpoNotif.getExpoPushTokenAsync({ projectId });
              const { api } = await import('../api/client');
              await api.push.unregister(tokenData.data);
            }
          } catch (e) { console.error(e); }
          await api.auth.logout({ refreshToken: getRefreshToken() });
        } catch (e) { console.error(e); }
        setToken(null, null);
        set({ currentUser: null, blockedUsers: [], isLoading: false, error: null });
        // Clear all store data
        useOfflineStore.getState().reset();
        AsyncStorage.multiRemove([
          'post-storage', 'offline-storage', 'notification-storage',
        ]).catch(() => {});
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        blockedUsers: state.blockedUsers,
      }),
    }
  )
);
