import { describe, it, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { execFileSync } from "node:child_process";
import { db } from "./index";
import { user } from "./auth-schema";

const testUsername = "seed-test-admin";

afterEach(async () => {
  await db.delete(user).where(eq(user.username, testUsername));
});

describe("db:seed", () => {
  it("creates an admin user from env vars", () => {
    execFileSync("npx", ["tsx", "src/db/seed.ts"], {
      env: {
        ...process.env,
        SEED_ADMIN_USERNAME: testUsername,
        SEED_ADMIN_EMAIL: "seed-test-admin@example.com",
        SEED_ADMIN_PASSWORD: "correct-horse-battery-staple",
      },
      stdio: "pipe",
    });
  });
});
