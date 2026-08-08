import { describe, it, expect, beforeEach } from "vitest";
import { useVotingStore } from "./voting-store";

beforeEach(() => {
  useVotingStore.getState().reset();
});

describe("useVotingStore", () => {
  it("tracks the search query", () => {
    useVotingStore.getState().setSearchQuery("amara");
    expect(useVotingStore.getState().searchQuery).toBe("amara");
  });

  it("records a candidate selection per position", () => {
    useVotingStore.getState().selectCandidate("position-1", "candidate-a");
    useVotingStore.getState().selectCandidate("position-2", "candidate-b");
    expect(useVotingStore.getState().selections).toEqual({
      "position-1": "candidate-a",
      "position-2": "candidate-b",
    });
  });

  it("overwrites a prior selection for the same position", () => {
    useVotingStore.getState().selectCandidate("position-1", "candidate-a");
    useVotingStore.getState().selectCandidate("position-1", "candidate-c");
    expect(useVotingStore.getState().selections).toEqual({ "position-1": "candidate-c" });
  });

  it("clears search and selections on reset", () => {
    useVotingStore.getState().setSearchQuery("amara");
    useVotingStore.getState().selectCandidate("position-1", "candidate-a");
    useVotingStore.getState().reset();
    expect(useVotingStore.getState()).toMatchObject({ searchQuery: "", selections: {} });
  });
});
