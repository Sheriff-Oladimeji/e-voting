import { create } from "zustand";

type VotingState = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selections: Record<string, string>; // positionId -> candidateId
  selectCandidate: (positionId: string, candidateId: string) => void;
  reset: () => void;
};

export const useVotingStore = create<VotingState>((set) => ({
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  selections: {},
  selectCandidate: (positionId, candidateId) =>
    set((state) => ({ selections: { ...state.selections, [positionId]: candidateId } })),
  reset: () => set({ searchQuery: "", selections: {} }),
}));
