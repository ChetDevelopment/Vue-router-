import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineState {
  isOfflineSimulated: boolean;
  drafts: any[];
  isSyncing: boolean;
  syncProgress: number;
  toggleOffline: () => void;
  addDraft: (draft: any) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
  reset: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      isOfflineSimulated: false,
      drafts: [],
      isSyncing: false,
      syncProgress: 0,

      toggleOffline: () => set((state) => ({ isOfflineSimulated: !state.isOfflineSimulated })),

      addDraft: (draft) =>
        set((state) => {
          const updated = [...state.drafts, draft];
          return { drafts: updated };
        }),

      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setSyncProgress: (progress) => set({ syncProgress: progress }),
      reset: () => set({ isOfflineSimulated: false, drafts: [], isSyncing: false, syncProgress: 0 }),
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
