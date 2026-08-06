import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { election, position, candidate, ballot, vote } from "@/db/schema";
import { castVote } from "./votes";

async function seedElection(status: "active" | "closed" | "draft") {
  const [e] = await db
    .insert(election)
    .values({ title: "Test Election", status, startAt: new Date(Date.now() - 1000), endAt: new Date(Date.now() + 1000 * 60 * 60) })
    .returning();
  const [p] = await db.insert(position).values({ electionId: e.id, title: "President" }).returning();
  const [c] = await db.insert(candidate).values({ positionId: p.id, name: "Jane Doe" }).returning();
  return { election: e, position: p, candidate: c };
}

async function cleanupElection(electionId: string, positionId: string, candidateId: string) {
  await db.delete(vote).where(eq(vote.positionId, positionId));
  await db.delete(ballot).where(eq(ballot.positionId, positionId));
  await db.delete(candidate).where(eq(candidate.id, candidateId));
  await db.delete(position).where(eq(position.id, positionId));
  await db.delete(election).where(eq(election.id, electionId));
}

describe("castVote", () => {
  it("records a vote and blocks a second vote for the same student+position", async () => {
    const { election: e, position: p, candidate: c } = await seedElection("active");
    const studentId = "test-student-id-1";

    const first = await castVote({ studentId, electionId: e.id, positionId: p.id, candidateId: c.id });
    expect(first).toEqual({ success: true });

    const second = await castVote({ studentId, electionId: e.id, positionId: p.id, candidateId: c.id });
    expect(second.success).toBe(false);
    if (!second.success) {
      expect(second.error).toMatch(/already voted/i);
    }

    const voteRows = await db.select().from(vote).where(eq(vote.positionId, p.id));
    expect(voteRows).toHaveLength(1);
    expect(Object.keys(voteRows[0])).not.toContain("studentId");

    const ballotRows = await db.select().from(ballot).where(eq(ballot.positionId, p.id));
    expect(ballotRows).toHaveLength(1);

    await cleanupElection(e.id, p.id, c.id);
  });

  it("rejects a vote when the election is not active, even within the time window", async () => {
    const { election: e, position: p, candidate: c } = await seedElection("draft");
    const studentId = "test-student-id-2";

    const result = await castVote({ studentId, electionId: e.id, positionId: p.id, candidateId: c.id });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/not open/i);
    }

    const voteRows = await db.select().from(vote).where(eq(vote.positionId, p.id));
    expect(voteRows).toHaveLength(0);

    await cleanupElection(e.id, p.id, c.id);
  });
});
