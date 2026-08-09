"use server";

import { revalidatePath } from "next/cache";
import {
  importStudents,
  updateStudent,
  removeStudent,
  type StudentImportRow,
  type StudentImportResult,
} from "@/db/queries/students";
import { requireAdmin } from "@/lib/get-session";

// Takes already-parsed rows (not raw CSV text) so the client can chunk a large
// file into batches and show real progress between calls, instead of one long
// opaque request for the whole file. startRow lets error messages report the
// row's true position in the original file, not its position within the batch.
export async function importStudentBatchAction(
  rows: StudentImportRow[],
  startRow: number
): Promise<StudentImportResult> {
  await requireAdmin();
  const result = await importStudents(rows, startRow);
  revalidatePath("/admin/students");
  return result;
}

export async function addSingleStudentAction(row: StudentImportRow): Promise<StudentImportResult> {
  await requireAdmin();
  const result = await importStudents([row]);
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
