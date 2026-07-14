import { create } from 'zustand';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../constants/data';

interface AuthState {
  currentUser: User | null;
  blockedUsernames: string[];
  setCurrentUser: (user: User | null) => void;
  updateProfile: (fields: Partial<User>) => void;
  updateRole: (role: UserRole) => void;
  blockUser: (username: string) => void;
  unblockUser: (username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: INITIAL_USERS[1],
  blockedUsernames: [],
  setCurrentUser: (user) => set({ currentUser: user }),
  updateProfile: (fields) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...fields } : null,
    })),
  updateRole: (role) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, role, isCreator: role === 'creator' ? true : state.currentUser.isCreator }
        : null,
    })),
  blockUser: (username) =>
    set((state) => ({ blockedUsernames: [...state.blockedUsernames, username] })),
  unblockUser: (username) =>
    set((state) => ({ blockedUsernames: state.blockedUsernames.filter((n) => n !== username) })),
  logout: () => set({ currentUser: null }),
}));
