"use server";

import { revalidatePath } from "next/cache";
import { parseCsvWithHeader } from "@/lib/csv";
import {
  importStudents,
  updateStudent,
  removeStudent,
  resendInvite,
  type StudentImportResult,
} from "@/db/queries/students";
import { requireAdmin } from "@/lib/get-session";

export async function importStudentsFromCsv(csvText: string): Promise<StudentImportResult> {
  await requireAdmin();
  const rows = parseCsvWithHeader(csvText);
  const result = await importStudents(rows);
  revalidatePath("/admin/students");
  return result;
}

export async function updateStudentAction(
  userId: string,
  input: { name: string; faculty: string; department: string }
) {
  await requireAdmin();
  await updateStudent(userId, input);
  revalidatePath("/admin/students");
}

export async function removeStudentAction(userId: string) {
  await requireAdmin();
  await removeStudent(userId);
  revalidatePath("/admin/students");
}

export async function resendInviteAction(userId: string) {
  await requireAdmin();
  await resendInvite(userId);
}
