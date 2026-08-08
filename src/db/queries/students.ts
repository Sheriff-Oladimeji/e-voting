import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { isValidUsername } from "@/lib/username-format";

export type StudentImportRow = {
  matric_number?: string;
  name?: string;
  email?: string;
  faculty?: string;
  department?: string;
};

export type StudentImportResult = {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
};

export async function importStudents(rows: StudentImportRow[]): Promise<StudentImportResult> {
  const result: StudentImportResult = { created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // +1 for 0-index, +1 for the header row
    const { matric_number: matricNumber, name, email, faculty, department } = rows[i];

    if (!matricNumber || !name || !email) {
      result.errors.push({ row: rowNumber, reason: "Missing matric_number, name, or email" });
      continue;
    }
    if (!isValidUsername(matricNumber)) {
      result.errors.push({ row: rowNumber, reason: `Invalid matric number format: "${matricNumber}"` });
      continue;
    }

    const [existing] = await db.select().from(user).where(eq(user.username, matricNumber));
    if (existing) {
      result.skipped++;
      continue;
    }

    try {
      await auth.api.signUpEmail({
        body: { email, password: randomUUID(), name, username: matricNumber },
      });
      await db
        .update(user)
        .set({ faculty: faculty || null, department: department || null })
        .where(eq(user.username, matricNumber));

      // Best-effort invite email — a delivery failure shouldn't fail the whole import.
      // The admin can always trigger a password reset for the student later.
      try {
        await auth.api.requestPasswordReset({ body: { email } });
      } catch (emailErr) {
        console.error(`Invite email failed for ${matricNumber}:`, emailErr);
      }

      result.created++;
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";
      result.errors.push({ row: rowNumber, reason });
    }
  }

  return result;
}
