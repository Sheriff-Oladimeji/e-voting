import { create } from "zustand";

type VotingState = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selections: Record<string, string>; // positionId -> candidateId
  selectCandidate: (positionId: string, candidateId: string) => void;
  clearSelections: (positionIds: string[]) => void;
  reset: () => void;
};

export const useVotingStore = create<VotingState>((set) => ({
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  selections: {},
  selectCandidate: (positionId, candidateId) =>
    set((state) => ({ selections: { ...state.selections, [positionId]: candidateId } })),
  // Drops just the given positions from the in-progress selection — used
  // after a partial vote-submission failure, so positions that already
  // succeeded aren't resubmitted (and don't surface a confusing "already
  // voted" error next to the real failure) while the rest stay selected.
  clearSelections: (positionIds) =>
    set((state) => {
      const next = { ...state.selections };
      for (const id of positionIds) delete next[id];
      return { selections: next };
    }),
  reset: () => set({ searchQuery: "", selections: {} }),
}));
