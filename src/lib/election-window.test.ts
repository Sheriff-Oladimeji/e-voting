import { describe, it, expect } from "vitest";
import { isElectionOpen } from "./election-window";

const baseElection = {
  status: "active" as const,
  startAt: new Date("2026-01-01T00:00:00Z"),
  endAt: new Date("2026-01-08T00:00:00Z"),
};

describe("isElectionOpen", () => {
  it("is open when status is active and now is within the window", () => {
    expect(isElectionOpen(baseElection, new Date("2026-01-03T00:00:00Z"))).toBe(true);
  });

  it("is closed when status is not active, even within the time window", () => {
    expect(isElectionOpen({ ...baseElection, status: "closed" }, new Date("2026-01-03T00:00:00Z"))).toBe(false);
  });

  it("is closed when now is before startAt", () => {
    expect(isElectionOpen(baseElection, new Date("2025-12-31T00:00:00Z"))).toBe(false);
  });

  it("is closed when now is after endAt", () => {
    expect(isElectionOpen(baseElection, new Date("2026-01-09T00:00:00Z"))).toBe(false);
  });
});
