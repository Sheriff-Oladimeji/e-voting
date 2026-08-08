import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { election, position, candidate, vote, ballot } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { auth } from "@/lib/auth";
import { getVoteTallyForElection, getTurnoutForElection } from "./results";

let electionId: string | null = null;
let positionId: string | null = null;
const testUsernames = ["test-results-2022/700001", "test-results-2022/700002", "test-results-2022/700003"];

afterEach(async () => {
  if (positionId) {
    await db.delete(vote).where(eq(vote.positionId, positionId));
    await db.delete(ballot).where(eq(ballot.positionId, positionId));
    await db.delete(candidate).where(eq(candidate.positionId, positionId));
    await db.delete(position).where(eq(position.id, positionId));
  }
  if (electionId) await db.delete(election).where(eq(election.id, electionId));
  for (const username of testUsernames) {
    await db.delete(user).where(eq(user.username, username));
  }
  electionId = null;
  positionId = null;
});

describe("getVoteTallyForElection", () => {
  it("counts votes per candidate, including zero for candidates with no votes", async () => {
    const [e] = await db
      .insert(election)
      .values({ title: "Tally Test Election", status: "active", startAt: new Date(), endAt: new Date(Date.now() + 1000 * 60 * 60) })
      .returning();
    const [p] = await db.insert(position).values({ electionId: e.id, title: "President" }).returning();
    const [c1] = await db.insert(candidate).values({ positionId: p.id, name: "Amara Chukwu" }).returning();
    await db.insert(candidate).values({ positionId: p.id, name: "Tariq Bello" });
    electionId = e.id;
    positionId = p.id;

    await db.insert(vote).values([
      { positionId: p.id, candidateId: c1.id },
      { positionId: p.id, candidateId: c1.id },
    ]);

    const tally = await getVoteTallyForElection(e.id);
    const byCandidate = Object.fromEntries(tally.map((r) => [r.candidateName, r.voteCount]));
    expect(byCandidate["Amara Chukwu"]).toBe(2);
    expect(byCandidate["Tariq Bello"]).toBe(0);
  });
});

describe("getTurnoutForElection", () => {
  it("computes eligible vs voted counts, grouped by faculty and department", async () => {
    const [e] = await db
      .insert(election)
      .values({
        title: "Turnout Test Election",
        status: "active",
        startAt: new Date(),
        endAt: new Date(Date.now() + 1000 * 60 * 60),
        eligibleFaculties: ["Engineering"],
      })
      .returning();
    const [p] = await db.insert(position).values({ electionId: e.id, title: "President" }).returning();
    electionId = e.id;
    positionId = p.id;

    await auth.api.signUpEmail({
      body: { email: "voted-eng@example.com", password: "correct-horse-battery-staple", name: "Voted Student", username: testUsernames[0] },
    });
    await auth.api.signUpEmail({
      body: { email: "not-voted-eng@example.com", password: "correct-horse-battery-staple", name: "Not Voted Student", username: testUsernames[1] },
    });
    await auth.api.signUpEmail({
      body: { email: "ineligible@example.com", password: "correct-horse-battery-staple", name: "Ineligible Student", username: testUsernames[2] },
    });

    const [votedUser] = await db.select().from(user).where(eq(user.username, testUsernames[0]));
    await db.update(user).set({ faculty: "Engineering", department: "Computer Engineering" }).where(eq(user.username, testUsernames[0]));
    await db.update(user).set({ faculty: "Engineering", department: "Mechanical Engineering" }).where(eq(user.username, testUsernames[1]));
    await db.update(user).set({ faculty: "Sciences", department: "Physics" }).where(eq(user.username, testUsernames[2]));

    await db.insert(ballot).values({ studentId: votedUser.id, electionId: e.id, positionId: p.id });

    const turnout = await getTurnoutForElection(e.id);
    expect(turnout).not.toBeNull();
    expect(turnout!.totalEligible).toBe(2); // the two Engineering students, not the Sciences one
    expect(turnout!.totalVoted).toBe(1);

    const eng = turnout!.byFaculty.find((row) => row.label === "Engineering");
    expect(eng).toEqual({ label: "Engineering", eligible: 2, voted: 1 });
  });
});
