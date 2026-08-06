import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ballot, vote, election, candidate } from "@/db/schema";
import { isElectionOpen } from "@/lib/election-window";

export async function castVote(input: {
  studentId: string;
  electionId: string;
  positionId: string;
  candidateId: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const [electionRow] = await db.select().from(election).where(eq(election.id, input.electionId));
  if (!electionRow || !isElectionOpen(electionRow, new Date())) {
    return { success: false, error: "This election is not open for voting." };
  }

  const [candidateRow] = await db.select().from(candidate).where(eq(candidate.id, input.candidateId));
  if (!candidateRow || candidateRow.positionId !== input.positionId) {
    return { success: false, error: "This candidate is not running for the selected position." };
  }

  try {
    // drizzle-orm's neon-http driver has no support for db.transaction() — it throws
    // "No transactions support in neon-http driver" at runtime. db.batch() is Neon's
    // atomic alternative for the HTTP driver: both inserts commit or fail together.
    await db.batch([
      db.insert(ballot).values({
        studentId: input.studentId,
        electionId: input.electionId,
        positionId: input.positionId,
      }),
      db.insert(vote).values({
        positionId: input.positionId,
        candidateId: input.candidateId,
      }),
    ]);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("unique") || message.includes("duplicate key")) {
      return { success: false, error: "You've already voted for this position." };
    }
    throw err;
  }
}
