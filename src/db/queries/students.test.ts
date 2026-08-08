import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { importStudents, listStudents, updateStudent, removeStudent } from "./students";

const testUsernames = ["test-import-2022/900001", "test-import-2022/900002", "test-import-2022/900004"];

afterEach(async () => {
  for (const username of testUsernames) {
    await db.delete(user).where(eq(user.username, username));
  }
});

describe("importStudents", () => {
  it("creates new students and skips ones that already exist", async () => {
    const rows = [
      {
        matric_number: testUsernames[0],
        name: "Amara Chukwu",
        email: "amara-import-test@example.com",
        faculty: "Engineering",
        department: "Computer Engineering",
      },
    ];

    const first = await importStudents(rows);
    expect(first).toEqual({ created: 1, skipped: 0, errors: [] });

    const [created] = await db.select().from(user).where(eq(user.username, testUsernames[0]));
    expect(created.role).toBe("student");
    expect(created.faculty).toBe("Engineering");
    expect(created.department).toBe("Computer Engineering");

    const second = await importStudents(rows);
    expect(second).toEqual({ created: 0, skipped: 1, errors: [] });
  });

  it("reports a row error for an invalid matric number without failing the batch", async () => {
    const rows = [
      { matric_number: "has spaces", name: "Bad Row", email: "bad-import-test@example.com" },
      { matric_number: testUsernames[1], name: "Tariq Bello", email: "tariq-import-test@example.com" },
    ];

    const outcome = await importStudents(rows);
    expect(outcome.created).toBe(1);
    expect(outcome.errors).toHaveLength(1);
    expect(outcome.errors[0].reason).toMatch(/invalid matric number/i);
  });

  it("reports a row error for a missing required field", async () => {
    const outcome = await importStudents([{ matric_number: "2022/900003", name: "No Email" }]);
    expect(outcome.errors).toHaveLength(1);
    expect(outcome.errors[0].reason).toMatch(/missing/i);
  });
});

describe("listStudents / updateStudent / removeStudent", () => {
  it("lists only role=student users, updates their fields, and removes them", async () => {
    await importStudents([
      {
        matric_number: testUsernames[2],
        name: "Ifeoma Obi",
        email: "ifeoma-import-test@example.com",
        faculty: "Sciences",
      },
    ]);

    const listed = await listStudents();
    const found = listed.find((s) => s.username === testUsernames[2]);
    expect(found).toBeDefined();
    expect(found!.role).toBe("student");

    await updateStudent(found!.id, { name: "Ifeoma O. Chukwu", faculty: "Engineering", department: "Civil Engineering" });
    const [updated] = await db.select().from(user).where(eq(user.id, found!.id));
    expect(updated.name).toBe("Ifeoma O. Chukwu");
    expect(updated.faculty).toBe("Engineering");
    expect(updated.department).toBe("Civil Engineering");

    await removeStudent(found!.id);
    const afterRemoval = await db.select().from(user).where(eq(user.id, found!.id));
    expect(afterRemoval).toHaveLength(0);
  });
});
