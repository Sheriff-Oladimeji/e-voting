"use server";

import { parseCsvWithHeader } from "@/lib/csv";
import { importStudents, type StudentImportResult } from "@/db/queries/students";
import { requireAdmin } from "@/lib/get-session";

export async function importStudentsFromCsv(csvText: string): Promise<StudentImportResult> {
  await requireAdmin();
  const rows = parseCsvWithHeader(csvText);
  return importStudents(rows);
}
