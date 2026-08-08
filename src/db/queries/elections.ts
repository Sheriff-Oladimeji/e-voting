import { eq } from "drizzle-orm";
import { db } from "@/db";
import { election, position, type electionStatusEnum } from "@/db/schema";

type ElectionStatus = (typeof electionStatusEnum.enumValues)[number];

export async function createElection(input: {
  title: string;
  startAt: Date;
  endAt: Date;
  positionTitles: string[];
  eligibleFaculties?: string[];
  eligibleDepartments?: string[];
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

  if (input.positionTitles.length > 0) {
    await db.insert(position).values(
      input.positionTitles.map((title) => ({
        electionId: electionRow.id,
        title,
      }))
    );
  }

  return electionRow;
}

export async function listElections() {
  return db.select().from(election).orderBy(election.startAt);
}

export async function listActiveElections() {
  return db.select().from(election).where(eq(election.status, "active"));
}

export async function getElection(electionId: string) {
  const [row] = await db.select().from(election).where(eq(election.id, electionId));
  return row ?? null;
}

export async function listPositionsForElection(electionId: string) {
  return db.select().from(position).where(eq(position.electionId, electionId));
}

export async function updateElectionStatus(electionId: string, status: ElectionStatus) {
  await db.update(election).set({ status }).where(eq(election.id, electionId));
}
