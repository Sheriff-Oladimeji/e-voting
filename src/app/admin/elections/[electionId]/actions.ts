"use server";

import { revalidatePath } from "next/cache";
import { addCandidate, removeCandidate } from "@/db/queries/candidates";
import { requireAdmin } from "@/lib/get-session";

export async function addCandidateAction(
  electionId: string,
  input: {
    positionId: string;
    name: string;
    photoUrl: string;
    manifesto: string;
    faculty: string;
    department: string;
  }
) {
  await requireAdmin();
  await addCandidate(input);
  revalidatePath(`/admin/elections/${electionId}`);
}

export async function removeCandidateAction(electionId: string, candidateId: string) {
  await requireAdmin();
  await removeCandidate(candidateId);
  revalidatePath(`/admin/elections/${electionId}`);
}
