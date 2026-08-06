import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "@/db";
import { user } from "@/db/auth-schema";

const testUsername = "test-matric-0001";

afterEach(async () => {
  await db.delete(user).where(eq(user.username, testUsername));
});

describe("auth username login", () => {
  it("creates a user addressable by matric number (username), defaulting to student role", async () => {
    await auth.api.signUpEmail({
      body: {
        email: "test-student@example.com",
        password: "correct-horse-battery-staple",
        name: "Test Student",
        username: testUsername,
      },
    });

    const [created] = await db.select().from(user).where(eq(user.username, testUsername));
    expect(created).toBeDefined();
    expect(created.role).toBe("student");
  });
});
