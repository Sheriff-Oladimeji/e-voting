"use server";

import { revalidatePath } from "next/cache";
import { createElection, updateElection, updateElectionStatus, deleteElection } from "@/db/queries/elections";
import { requireAdmin } from "@/lib/get-session";

export async function createElectionAction(input: {
  title: string;
  startAt: string;
  endAt: string;
  positionTitles: string[];
  eligibleFaculties: string[];
  eligibleDepartments: string[];
}) {
  await requireAdmin();
  await createElection({
    title: input.title,
    startAt: new Date(input.startAt),
    endAt: new Date(input.endAt),
    positionTitles: input.positionTitles.filter(Boolean),
    eligibleFaculties: input.eligibleFaculties.filter(Boolean),
    eligibleDepartments: input.eligibleDepartments.filter(Boolean),
  });
  revalidatePath("/admin/elections");
}

export async function updateElectionAction(
  electionId: string,
  input: {
    title: string;
    startAt: string;
    endAt: string;
    eligibleFaculties: string[];
    eligibleDepartments: string[];
  }
) {
  await requireAdmin();
  await updateElection(electionId, {
    title: input.title,
    startAt: new Date(input.startAt),
    endAt: new Date(input.endAt),
    eligibleFaculties: input.eligibleFaculties.filter(Boolean),
    eligibleDepartments: input.eligibleDepartments.filter(Boolean),
  });
  revalidatePath("/admin/elections");
  revalidatePath(`/admin/elections/${electionId}`);
}

export async function updateElectionStatusAction(electionId: string, status: "draft" | "active" | "closed") {
  await requireAdmin();
  await updateElectionStatus(electionId, status);
  revalidatePath("/admin/elections");
  revalidatePath(`/admin/elections/${electionId}`);
}

export async function deleteElectionAction(electionId: string) {
  await requireAdmin();
  await deleteElection(electionId);
  revalidatePath("/admin/elections");
}
