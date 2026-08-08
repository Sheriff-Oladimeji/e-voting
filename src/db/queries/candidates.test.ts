import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { election, position, candidate } from "@/db/schema";
import { addCandidate, listCandidatesForElection, listCandidatesForPosition, removeCandidate } from "./candidates";

let electionId: string | null = null;
let positionId: string | null = null;

afterEach(async () => {
  if (positionId) await db.delete(candidate).where(eq(candidate.positionId, positionId));
  if (positionId) await db.delete(position).where(eq(position.id, positionId));
  if (electionId) await db.delete(election).where(eq(election.id, electionId));
  electionId = null;
  positionId = null;
});

async function seed() {
  const [e] = await db
    .insert(election)
    .values({ title: "Candidate Test Election", status: "draft", startAt: new Date(), endAt: new Date(Date.now() + 1000 * 60 * 60) })
    .returning();
  const [p] = await db.insert(position).values({ electionId: e.id, title: "President" }).returning();
  electionId = e.id;
  positionId = p.id;
  return { e, p };
}

describe("addCandidate / listCandidatesForPosition / removeCandidate", () => {
  it("adds a candidate and lists it under its position", async () => {
    const { p } = await seed();
    const created = await addCandidate({ positionId: p.id, name: "Amara Chukwu", faculty: "Engineering" });

    const list = await listCandidatesForPosition(p.id);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Amara Chukwu");
    expect(list[0].faculty).toBe("Engineering");

    await removeCandidate(created.id);
    expect(await listCandidatesForPosition(p.id)).toHaveLength(0);
  });

  it("lists candidates for an election joined with their position title", async () => {
    const { e, p } = await seed();
    await addCandidate({ positionId: p.id, name: "Tariq Bello" });

    const list = await listCandidatesForElection(e.id);
    expect(list).toHaveLength(1);
    expect(list[0].positionTitle).toBe("President");
    expect(list[0].name).toBe("Tariq Bello");
  });
});
