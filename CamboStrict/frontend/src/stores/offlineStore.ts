import { create } from 'zustand';

interface OfflineState {
  isOfflineSimulated: boolean;
  drafts: any[];
  isSyncing: boolean;
  syncProgress: number;
  toggleOffline: () => void;
  addDraft: (draft: any) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
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
}));
