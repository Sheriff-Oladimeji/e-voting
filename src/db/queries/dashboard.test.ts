import { describe, it, expect } from "vitest";
import { getAdminDashboardStats } from "./dashboard";

describe("getAdminDashboardStats", () => {
  it("returns non-negative counts whose election totals add up", async () => {
    // Not a before/after delta test: other test files run concurrently against
    // this same real database and constantly create/delete students, elections,
    // and votes, so a global-count snapshot comparison would be inherently racy.
    // This checks the function's shape and internal consistency instead.
    const stats = await getAdminDashboardStats();

    for (const value of Object.values(stats)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(value)).toBe(true);
    }

    expect(stats.draftElections + stats.activeElections + stats.closedElections).toBe(stats.totalElections);
  });
});
