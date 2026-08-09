import { and, eq } from "drizzle-orm";
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

export async function importStudents(
  rows: StudentImportRow[],
  startRow: number = 2 // +1 for 0-index, +1 for the header row — override when importing a batch/chunk of a larger file
): Promise<StudentImportResult> {
  const result: StudentImportResult = { created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = startRow + i;
    const { matric_number: matricNumber, name, email, faculty, department } = rows[i];

    if (!matricNumber || !name || !email) {
      result.errors.push({ row: rowNumber, reason: "Missing matric_number, name, or email" });
      continue;
    }
    if (!isValidUsername(matricNumber)) {
      result.errors.push({ row: rowNumber, reason: `Invalid matric number format: "${matricNumber}"` });
      continue;
    }

    const [existingByUsername] = await db.select().from(user).where(eq(user.username, matricNumber));
    const [existingByEmail] = await db.select().from(user).where(eq(user.email, email));
    if (existingByUsername || existingByEmail) {
      result.skipped++;
      continue;
    }

    try {
      // The password here is unusable/never shared — students sign in with a
      // one-time email code (see the emailOTP plugin in src/lib/auth.ts), never
      // a password, so there's no "set your password" invite step to send.
      await auth.api.signUpEmail({
        body: { email, password: randomUUID(), name, username: matricNumber },
      });
      await db
        .update(user)
        .set({ faculty: faculty || null, department: department || null })
        .where(eq(user.username, matricNumber));

      result.created++;
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";
      // A duplicate account slipping past the pre-check above (e.g. a race
      // between two rows importing at once) isn't a real error — skip it
      // the same way the pre-check does, instead of surfacing it as a failure.
      if (reason.toLowerCase().includes("already exists")) {
        result.skipped++;
        continue;
      }
      result.errors.push({ row: rowNumber, reason });
    }
  }

  return result;
}

export async function listStudents() {
  return db.select().from(user).where(eq(user.role, "student")).orderBy(user.username);
}

export async function updateStudent(
  userId: string,
  input: { name: string; faculty: string; department: string }
) {
  await db
    .update(user)
    .set({ name: input.name, faculty: input.faculty || null, department: input.department || null })
    .where(eq(user.id, userId));
}

export async function removeStudent(userId: string) {
  // Ballot rows for this student are intentionally left alone — votes already
  // cast must persist even if the account is later removed, and ballot.studentId
  // has no FK to user.id (see src/db/schema.ts) so no cascade would touch them anyway.
  await db.delete(user).where(eq(user.id, userId));
}

// Confirms a matric number and email belong to the same student record before
// an OTP is sent — requiring both (not just a known email) means requesting a
// code needs knowledge of the actual roster entry, not just an email address,
// and gives students a clear "that doesn't match" error instead of a code
// silently going nowhere on a typo.
export async function findStudentByMatricAndEmail(matricNumber: string, email: string) {
  const [student] = await db
    .select()
    .from(user)
    .where(and(eq(user.username, matricNumber), eq(user.email, email), eq(user.role, "student")));
  return student ?? null;
}
