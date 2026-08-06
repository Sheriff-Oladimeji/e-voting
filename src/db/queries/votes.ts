import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ballot, vote, election } from "@/db/schema";
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

  try {
    await db.transaction(async (tx) => {
      await tx.insert(ballot).values({
        studentId: input.studentId,
        electionId: input.electionId,
        positionId: input.positionId,
      });
      await tx.insert(vote).values({
        positionId: input.positionId,
        candidateId: input.candidateId,
      });
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("unique") || message.includes("duplicate key")) {
      return { success: false, error: "You've already voted for this position." };
    }
    throw err;
  }
}
