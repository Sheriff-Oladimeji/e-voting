"use server";

import { randomUUID } from "node:crypto";
import { getSessionUser } from "@/lib/get-session";
import { castVote } from "@/db/queries/votes";
import { getElection } from "@/db/queries/elections";
import { isStudentEligibleForElection } from "@/lib/eligibility";

export async function submitVotesAction(
  electionId: string,
  selections: Record<string, string>
): Promise<
  | { success: true; referenceCode: string }
  | { success: false; errors: string[]; succeededPositionIds: string[] }
> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, errors: ["You must be signed in to vote."], succeededPositionIds: [] };
  }
  if ((user as { role?: string }).role !== "student") {
    return { success: false, errors: ["Only students can vote."], succeededPositionIds: [] };
  }

  // Re-check eligibility here, not just on the page: this Server Action is
  // independently reachable regardless of whether the student ever loaded
  // the voting page that would normally 404 an ineligible student.
  const election = await getElection(electionId);
  const student = {
    faculty: (user as { faculty?: string }).faculty ?? null,
    department: (user as { department?: string }).department ?? null,
  };
  if (!election || !isStudentEligibleForElection(election, student)) {
    return { success: false, errors: ["You're not eligible to vote in this election."], succeededPositionIds: [] };
  }

  const errors: string[] = [];
  // Each position is cast independently, so a failure partway through still
  // leaves earlier positions voted — report exactly which ones succeeded so
  // the client can drop them from the retry instead of resubmitting them
  // (which would otherwise surface a confusing "already voted" error).
  const succeededPositionIds: string[] = [];
  for (const [positionId, candidateId] of Object.entries(selections)) {
    const result = await castVote({ studentId: user.id, electionId, positionId, candidateId });
    if (!result.success) {
      errors.push(result.error);
    } else {
      succeededPositionIds.push(positionId);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors, succeededPositionIds };
  }

  return { success: true, referenceCode: randomUUID().slice(0, 8).toUpperCase() };
}
