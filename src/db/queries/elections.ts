import { eq, inArray, and, lt } from "drizzle-orm";
import { db } from "@/db";
import { election, position, candidate, vote, ballot, type electionStatusEnum } from "@/db/schema";

type ElectionStatus = (typeof electionStatusEnum.enumValues)[number];

type CandidateInput = {
  name: string;
  photoUrl?: string;
  manifesto?: string;
  faculty?: string;
  department?: string;
};

export async function createElection(input: {
  title: string;
  startAt: Date;
  endAt: Date;
  positionTitles: string[];
  eligibleFaculties?: string[];
  eligibleDepartments?: string[];
  positionCandidates?: CandidateInput[][];
}) {
  const [electionRow] = await db
    .insert(election)
    .values({
      title: input.title,
      startAt: input.startAt,
      endAt: input.endAt,
      eligibleFaculties: input.eligibleFaculties?.length ? input.eligibleFaculties : null,
      eligibleDepartments: input.eligibleDepartments?.length ? input.eligibleDepartments : null,
    })
    .returning();

  for (let i = 0; i < input.positionTitles.length; i++) {
    const [positionRow] = await db
      .insert(position)
      .values({ electionId: electionRow.id, title: input.positionTitles[i] })
      .returning();

    const candidates = input.positionCandidates?.[i];
    if (candidates?.length) {
      await db.insert(candidate).values(
        candidates.map((c) => ({
          positionId: positionRow.id,
          name: c.name,
          photoUrl: c.photoUrl || null,
          manifesto: c.manifesto || null,
          faculty: c.faculty || null,
          department: c.department || null,
        }))
      );
    }
  }

  return electionRow;
}

// No cron/queue in this project (see PROJECT.md's "keep it simple" scope note)
// — an election's status is flipped from "active" to "closed" lazily, on the
// next read, rather than by a scheduled job. The WHERE clause makes this a
// no-op UPDATE once nothing is expired, so it's cheap to call from every read
// path that touches elections.
export async function closeExpiredElections() {
  await db
    .update(election)
    .set({ status: "closed" })
    .where(and(eq(election.status, "active"), lt(election.endAt, new Date())));
}

export async function listElections() {
  await closeExpiredElections();
  return db.select().from(election).orderBy(election.startAt);
}

export async function listActiveElections() {
  await closeExpiredElections();
  return db.select().from(election).where(eq(election.status, "active"));
}

export async function listClosedElections() {
  await closeExpiredElections();
  return db.select().from(election).where(eq(election.status, "closed"));
}

export async function getElection(electionId: string) {
  await closeExpiredElections();
  const [row] = await db.select().from(election).where(eq(election.id, electionId));
  return row ?? null;
}

export async function listPositionsForElection(electionId: string) {
  return db.select().from(position).where(eq(position.electionId, electionId));
}

export async function updateElectionStatus(electionId: string, status: ElectionStatus) {
  await db.update(election).set({ status }).where(eq(election.id, electionId));
}

export async function updateElection(
  electionId: string,
  input: {
    title: string;
    startAt: Date;
    endAt: Date;
    eligibleFaculties?: string[];
    eligibleDepartments?: string[];
  }
) {
  await db
    .update(election)
    .set({
      title: input.title,
      startAt: input.startAt,
      endAt: input.endAt,
      eligibleFaculties: input.eligibleFaculties?.length ? input.eligibleFaculties : null,
      eligibleDepartments: input.eligibleDepartments?.length ? input.eligibleDepartments : null,
    })
    .where(eq(election.id, electionId));
}

export async function deleteElection(electionId: string) {
  const positions = await db.select({ id: position.id }).from(position).where(eq(position.electionId, electionId));
  const positionIds = positions.map((p) => p.id);

  if (positionIds.length > 0) {
    await db.delete(vote).where(inArray(vote.positionId, positionIds));
    await db.delete(candidate).where(inArray(candidate.positionId, positionIds));
  }
  await db.delete(ballot).where(eq(ballot.electionId, electionId));
  await db.delete(position).where(eq(position.electionId, electionId));
  await db.delete(election).where(eq(election.id, electionId));
}
