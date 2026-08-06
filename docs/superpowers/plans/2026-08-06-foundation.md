# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the database schema, authentication (matric-number login via Better Auth), and route protection that every later sub-project (Admin: Setup, Student: Voting Flow, Admin: Results & Reporting) builds on.

**Architecture:** Next.js 16 App Router with server actions for all mutations. Drizzle ORM against Neon Postgres. Better Auth (`emailAndPassword` + `username` plugin) for login, backed by the same Drizzle/Neon database. Middleware enforces role-based route access.

**Tech Stack:** Next.js 16, Drizzle ORM, `@neondatabase/serverless`, Better Auth, Brevo (transactional email via direct API call, no SDK), Vitest.

## Global Constraints

- Matric number is the login identifier (Better Auth `username` plugin), not email. Email is retained only for password-reset/invite delivery.
- One vote per student per position is enforced by a DB unique constraint on `ballot(studentId, positionId)`, written in the same transaction as the anonymous `vote` insert — not app-level logic alone.
- The `vote` table must never contain a student-identifying column.
- No 2FA, no social login, no admin self-signup — admins are seeded manually.
- Keep implementation simple — this is a final-year project, not a production SaaS. Don't add abstractions beyond what each task needs.
- Integration tests run against the real Neon dev database (no separate test-DB/Docker infra) — each test cleans up the rows it creates.

## Prerequisite (manual, blocks Task 2 onward)

Before Task 2, a Neon Postgres project must exist and its connection string set as `DATABASE_URL`. This requires a Neon account — an agentic worker cannot provision this. Stop after Task 1 and ask the human to:
1. Create a project at Neon (or reuse an existing one for this project).
2. Copy the pooled connection string into `.env.local` as `DATABASE_URL`.
3. Set `BETTER_AUTH_SECRET` in `.env.local` to a random 32+ char string (`openssl rand -base64 32`).
4. Set `BETTER_AUTH_URL=http://localhost:3000` in `.env.local`.
5. Get a Brevo API key and a verified sender email; set `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` in `.env.local`.

---

### Task 1: Install dependencies and configure tooling

**Files:**
- Modify: `package.json`
- Create: `.env.local.example`
- Create: `.env.local` (gitignored — actual secrets go here, not committed)
- Create: `drizzle.config.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

**Interfaces:**
- Produces: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` env vars that every later task reads.
- Produces: `npm run test` (vitest), `npm run db:generate` / `npm run db:push` (drizzle-kit) scripts.

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless better-auth
npm install -D drizzle-kit dotenv tsx vitest @better-auth/cli
```

- [ ] **Step 2: Create `.env.local.example`**

```bash
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
```

- [ ] **Step 3: Copy to `.env.local` and stop for the human prerequisite**

```bash
cp .env.local.example .env.local
```

Do not proceed past this point until the human has filled in `.env.local` per the "Prerequisite" section above. Confirm `.env.local` is listed in `.gitignore` (it already should be from the Next.js scaffold) before continuing.

- [ ] **Step 4: Create `drizzle.config.ts`**

```typescript
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Note: `./src/db/auth-schema.ts` doesn't exist yet — it's generated in Task 3. `drizzle-kit` will simply find nothing there until then; this config is written now so Task 2 and Task 3 don't need to touch it again.

- [ ] **Step 5: Create `vitest.config.ts` and `vitest.setup.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

```typescript
// vitest.setup.ts
import "dotenv/config";
```

- [ ] **Step 6: Add `test` and `db:*` scripts to `package.json`**

Add to the `"scripts"` block:

```json
"test": "vitest run",
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:seed": "tsx src/db/seed.ts"
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .env.local.example drizzle.config.ts vitest.config.ts vitest.setup.ts .gitignore
git commit -m "chore: install Drizzle, Better Auth, Vitest and configure tooling"
```

(`.env.local` itself is never committed — verify it's gitignored before running `git add`.)

---

### Task 2: Domain schema (election, position, candidate, ballot, vote)

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `src/db/index.test.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` (Task 1).
- Produces: `db` (Drizzle client) from `src/db/index.ts`, and tables `election`, `position`, `candidate`, `ballot`, `vote` exported from `src/db/schema.ts` — used by Task 3 (auth schema needs `db`), Task 6 (`castVote`), Task 9 (seed script).

- [ ] **Step 1: Write `src/db/schema.ts`**

```typescript
import { pgTable, uuid, text, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";

export const electionStatusEnum = pgEnum("election_status", ["draft", "active", "closed"]);

export const election = pgTable("election", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  status: electionStatusEnum("status").notNull().default("draft"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  eligibleFaculties: text("eligible_faculties").array(),
  eligibleDepartments: text("eligible_departments").array(),
});

export const position = pgTable("position", {
  id: uuid("id").primaryKey().defaultRandom(),
  electionId: uuid("election_id").notNull().references(() => election.id),
  title: text("title").notNull(),
});

export const candidate = pgTable("candidate", {
  id: uuid("id").primaryKey().defaultRandom(),
  positionId: uuid("position_id").notNull().references(() => position.id),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  manifesto: text("manifesto"),
});

export const ballot = pgTable(
  "ballot",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: text("student_id").notNull(),
    electionId: uuid("election_id").notNull().references(() => election.id),
    positionId: uuid("position_id").notNull().references(() => position.id),
    votedAt: timestamp("voted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.studentId, table.positionId)]
);

export const vote = pgTable("vote", {
  id: uuid("id").primaryKey().defaultRandom(),
  positionId: uuid("position_id").notNull().references(() => position.id),
  candidateId: uuid("candidate_id").notNull().references(() => candidate.id),
  castAt: timestamp("cast_at", { withTimezone: true }).notNull().defaultNow(),
});
```

`ballot.studentId` is typed `text` (not a foreign key to `user`) because Better Auth's `user.id` type is a plain text/uuid string it manages itself — Task 3 generates that table. Not declaring the FK here avoids a circular schema-file dependency; the relationship is enforced at the application layer in `castVote` (Task 6).

- [ ] **Step 2: Write `src/db/index.ts`**

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 3: Generate and push the migration**

```bash
npm run db:generate
npm run db:push
```

Expected: drizzle-kit reports the 5 new tables (`election`, `position`, `candidate`, `ballot`, `vote`) created, no errors.

- [ ] **Step 4: Write `src/db/index.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { db } from "./index";
import { election } from "./schema";

describe("db connection", () => {
  it("can query the election table", async () => {
    const rows = await db.select().from(election);
    expect(Array.isArray(rows)).toBe(true);
  });
});
```

- [ ] **Step 5: Run the test**

Run: `npm run test -- src/db/index.test.ts`
Expected: PASS (empty array from the freshly created, empty table).

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/index.ts src/db/index.test.ts drizzle
git commit -m "feat: add domain schema (election, position, candidate, ballot, vote)"
```

---

### Task 3: Better Auth server instance with username login

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/db/auth-schema.ts` (generated, then committed)
- Create: `src/lib/auth.test.ts`

**Interfaces:**
- Consumes: `db` (Task 2, `src/db/index.ts`).
- Produces: `auth` (Better Auth server instance) from `src/lib/auth.ts` — used by Task 4 (email wiring), Task 8 (login server action), Task 9 (seed script), Task 10 (middleware session check).
- Produces: `user` table (fields: `id, email, username, role, faculty, department, ...` plus Better Auth's own fields) exported from `src/db/auth-schema.ts`.

- [ ] **Step 1: Write a placeholder `src/lib/auth.ts` so the CLI has a config to read**

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [username()],
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "student" },
      faculty: { type: "string", required: false },
      department: { type: "string", required: false },
    },
  },
});
```

- [ ] **Step 2: Generate the auth schema**

```bash
npx @better-auth/cli@latest generate --config src/lib/auth.ts --output src/db/auth-schema.ts -y
```

Expected: `src/db/auth-schema.ts` is created, defining `user`, `session`, `account`, `verification` Drizzle tables, with `role`/`faculty`/`department` present on `user`. If the CLI's flags differ from the above in the installed version (`npx @better-auth/cli@latest generate --help` to check), use the equivalent flags — the goal is a generated schema file at that exact path.

- [ ] **Step 3: Point the adapter at the generated schema**

Update `src/lib/auth.ts`'s `database` line:

```typescript
import * as authSchema from "@/db/auth-schema";

// ...
database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
```

- [ ] **Step 4: Push the auth tables**

```bash
npm run db:push
```

Expected: `user`, `session`, `account`, `verification` tables created.

- [ ] **Step 5: Write `src/lib/auth.test.ts`**

```typescript
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
```

- [ ] **Step 6: Run the test**

Run: `npm run test -- src/lib/auth.test.ts`
Expected: PASS. If `auth.api.signUpEmail`'s body shape doesn't match the installed version's types, check `node_modules/better-auth`'s type definitions for the exact signature — Better Auth's plugin APIs have shifted across versions — and adjust the call accordingly; the test's intent (create a user, verify it's queryable by `username` with default role `student`) stays the same.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts src/db/auth-schema.ts drizzle
git commit -m "feat: configure Better Auth with matric-number (username) login"
```

---

### Task 4: Brevo email delivery for password reset/invite

**Files:**
- Create: `src/lib/email.ts`
- Create: `src/lib/email.test.ts`
- Modify: `src/lib/auth.ts`

**Interfaces:**
- Consumes: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (Task 1 env vars).
- Produces: `sendAccountEmail({ to, url, mode }): Promise<void>` from `src/lib/email.ts` — `mode` is `"invite" | "reset"`, selecting which copy to send. This task wires `mode: "reset"` into Better Auth's `sendResetPassword` hook. The Admin: Setup sub-project (CSV import) will reuse this same function for the first-time invite email with `mode: "invite"`; exactly how it triggers that (a custom flag on Better Auth's forgot-password call, or a separate code path) is that sub-project's own decision, made once its plan inspects the installed Better Auth version's API — not assumed here.

- [ ] **Step 1: Write `src/lib/email.ts`**

```typescript
type AccountEmailMode = "invite" | "reset";

export async function sendAccountEmail({
  to,
  url,
  mode,
}: {
  to: string;
  url: string;
  mode: AccountEmailMode;
}): Promise<void> {
  const subject = mode === "invite" ? "Set your password" : "Reset your password";
  const intro =
    mode === "invite"
      ? "An account has been created for you. Click below to set your password and get started."
      : "Click below to reset your password.";

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: process.env.BREVO_SENDER_EMAIL!, name: "University Elections" },
      to: [{ email: to }],
      subject,
      htmlContent: `<p>${intro}</p><p><a href="${url}">${subject}</a></p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Brevo send failed: ${response.status} ${await response.text()}`);
  }
}
```

- [ ] **Step 2: Write `src/lib/email.test.ts` with a mocked `fetch`**

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import { sendAccountEmail } from "./email";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendAccountEmail", () => {
  it("sends invite copy with the correct Brevo request shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendAccountEmail({ to: "student@example.com", url: "https://app.test/set-password?token=abc", mode: "invite" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({ method: "POST" })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.subject).toBe("Set your password");
    expect(body.to).toEqual([{ email: "student@example.com" }]);
  });

  it("throws when Brevo responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => "bad request" })
    );

    await expect(
      sendAccountEmail({ to: "x@example.com", url: "https://app.test", mode: "reset" })
    ).rejects.toThrow("Brevo send failed");
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `npm run test -- src/lib/email.test.ts`
Expected: both PASS. No real network call is made (`fetch` is stubbed).

- [ ] **Step 4: Wire into `src/lib/auth.ts`**

```typescript
import { sendAccountEmail } from "./email";

// inside betterAuth({...}):
emailAndPassword: {
  enabled: true,
  sendResetPassword: async ({ user, url }) => {
    await sendAccountEmail({ to: user.email, url, mode: "reset" });
  },
},
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/email.ts src/lib/email.test.ts src/lib/auth.ts
git commit -m "feat: send password reset/invite emails via Brevo"
```

---

### Task 5: Role and election-window pure-logic helpers

**Files:**
- Create: `src/lib/roles.ts`
- Create: `src/lib/roles.test.ts`
- Create: `src/lib/election-window.ts`
- Create: `src/lib/election-window.test.ts`

**Interfaces:**
- Produces: `hasRole(user: { role: string } | null, role: "admin" | "student"): boolean` from `src/lib/roles.ts` — used by Task 10 (middleware).
- Produces: `isElectionOpen(election: { status: string; startAt: Date; endAt: Date }, now: Date): boolean` from `src/lib/election-window.ts` — used by Task 6 (`castVote`) and later by the Student Voting Flow sub-project.

- [ ] **Step 1: Write the failing tests for `roles.ts`**

```typescript
// src/lib/roles.test.ts
import { describe, it, expect } from "vitest";
import { hasRole } from "./roles";

describe("hasRole", () => {
  it("returns true when the user's role matches", () => {
    expect(hasRole({ role: "admin" }, "admin")).toBe(true);
  });

  it("returns false when the user's role doesn't match", () => {
    expect(hasRole({ role: "student" }, "admin")).toBe(false);
  });

  it("returns false when there is no user", () => {
    expect(hasRole(null, "admin")).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- src/lib/roles.test.ts`
Expected: FAIL — `./roles` has no exported member `hasRole` (module doesn't exist yet).

- [ ] **Step 3: Write `src/lib/roles.ts`**

```typescript
export function hasRole(
  user: { role: string } | null | undefined,
  role: "admin" | "student"
): boolean {
  return user?.role === role;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- src/lib/roles.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing tests for `election-window.ts`**

```typescript
// src/lib/election-window.test.ts
import { describe, it, expect } from "vitest";
import { isElectionOpen } from "./election-window";

const baseElection = {
  status: "active" as const,
  startAt: new Date("2026-01-01T00:00:00Z"),
  endAt: new Date("2026-01-08T00:00:00Z"),
};

describe("isElectionOpen", () => {
  it("is open when status is active and now is within the window", () => {
    expect(isElectionOpen(baseElection, new Date("2026-01-03T00:00:00Z"))).toBe(true);
  });

  it("is closed when status is not active, even within the time window", () => {
    expect(isElectionOpen({ ...baseElection, status: "closed" }, new Date("2026-01-03T00:00:00Z"))).toBe(false);
  });

  it("is closed when now is before startAt", () => {
    expect(isElectionOpen(baseElection, new Date("2025-12-31T00:00:00Z"))).toBe(false);
  });

  it("is closed when now is after endAt", () => {
    expect(isElectionOpen(baseElection, new Date("2026-01-09T00:00:00Z"))).toBe(false);
  });
});
```

- [ ] **Step 6: Run to verify it fails**

Run: `npm run test -- src/lib/election-window.test.ts`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 7: Write `src/lib/election-window.ts`**

```typescript
export function isElectionOpen(
  election: { status: string; startAt: Date; endAt: Date },
  now: Date
): boolean {
  return election.status === "active" && now >= election.startAt && now <= election.endAt;
}
```

- [ ] **Step 8: Run to verify it passes**

Run: `npm run test -- src/lib/election-window.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/roles.ts src/lib/roles.test.ts src/lib/election-window.ts src/lib/election-window.test.ts
git commit -m "feat: add role-check and election-window pure-logic helpers"
```

---

### Task 6: `castVote` — the anonymized ballot/vote transaction

**Files:**
- Create: `src/db/queries/votes.ts`
- Create: `src/db/queries/votes.test.ts`

**Interfaces:**
- Consumes: `db` (Task 2), `election`/`position`/`candidate`/`ballot`/`vote` tables (Task 2), `isElectionOpen` (Task 5).
- Produces: `castVote(input: { studentId: string; electionId: string; positionId: string; candidateId: string }): Promise<{ success: true } | { success: false; error: string }>` from `src/db/queries/votes.ts` — used by the Student Voting Flow sub-project's vote-casting server action.

This is the most safety-critical piece in Foundation: it's what makes "one vote per student per position" and "votes are anonymized" true at the database level, per `PROJECT.md`'s non-negotiables.

- [ ] **Step 1: Write the failing test**

```typescript
// src/db/queries/votes.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { election, position, candidate, ballot, vote } from "@/db/schema";
import { castVote } from "./votes";

async function seedElection(status: "active" | "closed" | "draft") {
  const [e] = await db
    .insert(election)
    .values({ title: "Test Election", status, startAt: new Date(Date.now() - 1000), endAt: new Date(Date.now() + 1000 * 60 * 60) })
    .returning();
  const [p] = await db.insert(position).values({ electionId: e.id, title: "President" }).returning();
  const [c] = await db.insert(candidate).values({ positionId: p.id, name: "Jane Doe" }).returning();
  return { election: e, position: p, candidate: c };
}

async function cleanupElection(electionId: string, positionId: string, candidateId: string) {
  await db.delete(vote).where(eq(vote.positionId, positionId));
  await db.delete(ballot).where(eq(ballot.positionId, positionId));
  await db.delete(candidate).where(eq(candidate.id, candidateId));
  await db.delete(position).where(eq(position.id, positionId));
  await db.delete(election).where(eq(election.id, electionId));
}

describe("castVote", () => {
  it("records a vote and blocks a second vote for the same student+position", async () => {
    const { election: e, position: p, candidate: c } = await seedElection("active");
    const studentId = "test-student-id-1";

    const first = await castVote({ studentId, electionId: e.id, positionId: p.id, candidateId: c.id });
    expect(first).toEqual({ success: true });

    const second = await castVote({ studentId, electionId: e.id, positionId: p.id, candidateId: c.id });
    expect(second.success).toBe(false);
    if (!second.success) {
      expect(second.error).toMatch(/already voted/i);
    }

    const voteRows = await db.select().from(vote).where(eq(vote.positionId, p.id));
    expect(voteRows).toHaveLength(1);
    expect(Object.keys(voteRows[0])).not.toContain("studentId");

    const ballotRows = await db.select().from(ballot).where(eq(ballot.positionId, p.id));
    expect(ballotRows).toHaveLength(1);

    await cleanupElection(e.id, p.id, c.id);
  });

  it("rejects a vote when the election is not active, even within the time window", async () => {
    const { election: e, position: p, candidate: c } = await seedElection("draft");
    const studentId = "test-student-id-2";

    const result = await castVote({ studentId, electionId: e.id, positionId: p.id, candidateId: c.id });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/not open/i);
    }

    const voteRows = await db.select().from(vote).where(eq(vote.positionId, p.id));
    expect(voteRows).toHaveLength(0);

    await cleanupElection(e.id, p.id, c.id);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- src/db/queries/votes.test.ts`
Expected: FAIL — `./votes` has no exported member `castVote`.

- [ ] **Step 3: Write `src/db/queries/votes.ts`**

```typescript
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ballot, vote, election } from "@/db/schema";
import { isElectionOpen } from "@/lib/election-window";

export async function castVote(input: {
  studentId: string;
  electionId: string;
  positionId: string;
  candidateId: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const [electionRow] = await db.select().from(election).where(eq(election.id, input.electionId));
  if (!electionRow || !isElectionOpen(electionRow, new Date())) {
    return { success: false, error: "This election is not open for voting." };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(ballot).values({
        studentId: input.studentId,
        electionId: input.electionId,
        positionId: input.positionId,
      });
      await tx.insert(vote).values({
        positionId: input.positionId,
        candidateId: input.candidateId,
      });
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("unique") || message.includes("duplicate key")) {
      return { success: false, error: "You've already voted for this position." };
    }
    throw err;
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- src/db/queries/votes.test.ts`
Expected: PASS. If the Neon driver's unique-violation error message doesn't contain `"unique"` or `"duplicate key"` in the installed version, log the actual error message from a failing run and adjust the substring check in `castVote` to match it — Postgres unique-violation errors are consistently identifiable this way, but exact wording varies slightly by driver.

- [ ] **Step 5: Commit**

```bash
git add src/db/queries/votes.ts src/db/queries/votes.test.ts
git commit -m "feat: add castVote transaction enforcing one-vote-per-position and anonymity"
```

---

### Task 7: Admin seed script

**Files:**
- Create: `src/db/seed.ts`
- Create: `src/db/seed.test.ts`

**Interfaces:**
- Consumes: `auth` (Task 3), `db`/`user` table (Task 2/3).
- Produces: a runnable `npm run db:seed` that creates one admin account from env vars `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

- [ ] **Step 1: Add seed env vars to `.env.local.example`**

```bash
SEED_ADMIN_USERNAME=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
```

Add matching values to the real `.env.local` (human picks the admin's actual matric-style username, email, and a strong password).

- [ ] **Step 2: Write `src/db/seed.ts`**

```typescript
import "dotenv/config";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/auth-schema";

async function seedAdmin() {
  const username = process.env.SEED_ADMIN_USERNAME!;
  const email = process.env.SEED_ADMIN_EMAIL!;
  const password = process.env.SEED_ADMIN_PASSWORD!;

  const [existing] = await db.select().from(user).where(eq(user.username, username));
  if (existing) {
    console.log(`Admin ${username} already exists, skipping.`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password, name: "Admin", username },
  });
  await db.update(user).set({ role: "admin" }).where(eq(user.username, username));
  console.log(`Seeded admin: ${username}`);
}

seedAdmin().then(() => process.exit(0));
```

- [ ] **Step 3: Write `src/db/seed.test.ts`**

```typescript
import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { execSync } from "node:child_process";
import { db } from "./index";
import { user } from "./auth-schema";

const testUsername = "seed-test-admin";

afterEach(async () => {
  await db.delete(user).where(eq(user.username, testUsername));
});

describe("db:seed", () => {
  it("creates an admin user from env vars", () => {
    execSync("tsx src/db/seed.ts", {
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
```

- [ ] **Step 4: Run the test**

Run: `npm run test -- src/db/seed.test.ts`
Expected: PASS. Then verify manually: `npm run db:seed` (with real `.env.local` admin values set) and confirm no error.

- [ ] **Step 5: Commit**

```bash
git add src/db/seed.ts src/db/seed.test.ts .env.local.example
git commit -m "feat: add admin seed script"
```

---

### Task 8: Auth client and login page

**Files:**
- Create: `src/lib/auth-client.ts`
- Create: `src/app/login/actions.ts`
- Create: `src/app/login/actions.test.ts`
- Create: `src/app/login/page.tsx`

**Interfaces:**
- Consumes: `auth` (Task 3).
- Produces: `signIn(formData: { username: string; password: string }): Promise<{ success: true } | { success: false; error: string }>` server action from `src/app/login/actions.ts`.

- [ ] **Step 1: Write `src/lib/auth-client.ts`**

```typescript
import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient()],
});
```

- [ ] **Step 2: Write the failing test for the sign-in server action's error shaping**

```typescript
// src/app/login/actions.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: { api: { signInUsername: vi.fn() } },
}));

import { auth } from "@/lib/auth";
import { signIn } from "./actions";

afterEach(() => {
  vi.clearAllMocks();
});

describe("signIn action", () => {
  it("returns success on valid credentials", async () => {
    (auth.api.signInUsername as any).mockResolvedValue({ user: { id: "1" } });
    const result = await signIn({ username: "u1", password: "p1" });
    expect(result).toEqual({ success: true });
  });

  it("returns a friendly error on invalid credentials", async () => {
    (auth.api.signInUsername as any).mockRejectedValue(new Error("Invalid username or password"));
    const result = await signIn({ username: "u1", password: "wrong" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/invalid/i);
    }
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test -- src/app/login/actions.test.ts`
Expected: FAIL — `./actions` has no exported member `signIn`.

- [ ] **Step 4: Write `src/app/login/actions.ts`**

```typescript
"use server";

import { auth } from "@/lib/auth";

export async function signIn(input: {
  username: string;
  password: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await auth.api.signInUsername({ body: input });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed";
    return { success: false, error: message };
  }
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run test -- src/app/login/actions.test.ts`
Expected: PASS.

- [ ] **Step 6: Write `src/app/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signIn } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await signIn({ username, password });
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-24 flex max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <label className="flex flex-col gap-1">
        Matric Number
        <input
          className="rounded border px-3 py-2"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        Password
        <input
          type="password"
          className="rounded border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 7: Manually verify**

Run: `npm run dev`, visit `http://localhost:3000/login`, sign in with the seeded admin's username/password from Task 7. Expected: redirects to `/` with no error. Signing in with a wrong password shows the friendly error text.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth-client.ts src/app/login
git commit -m "feat: add matric-number login page and sign-in server action"
```

---

### Task 9: Route protection middleware

**Files:**
- Create: `src/lib/route-access.ts`
- Create: `src/lib/route-access.test.ts`
- Create: `src/middleware.ts`
- Create: `src/app/403/page.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `hasRole` (Task 5), `auth` (Task 3).
- Produces: nothing consumed by later sub-projects directly, but establishes the `/admin/*` and `/dashboard/*` route groups those sub-projects add pages under.

- [ ] **Step 1: Write the failing test for the pure access-decision function**

```typescript
// src/lib/route-access.test.ts
import { describe, it, expect } from "vitest";
import { resolveRouteAccess } from "./route-access";

describe("resolveRouteAccess", () => {
  it("redirects to login when there is no session on a protected route", () => {
    expect(resolveRouteAccess("/admin", null)).toBe("redirect-login");
  });

  it("allows an admin onto /admin", () => {
    expect(resolveRouteAccess("/admin", { role: "admin" })).toBe("allow");
  });

  it("forbids a student on /admin", () => {
    expect(resolveRouteAccess("/admin", { role: "student" })).toBe("forbidden");
  });

  it("allows a student onto /dashboard", () => {
    expect(resolveRouteAccess("/dashboard", { role: "student" })).toBe("allow");
  });

  it("forbids an admin on /dashboard", () => {
    expect(resolveRouteAccess("/dashboard", { role: "admin" })).toBe("forbidden");
  });

  it("allows unauthenticated access to unprotected routes", () => {
    expect(resolveRouteAccess("/login", null)).toBe("allow");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- src/lib/route-access.test.ts`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Write `src/lib/route-access.ts`**

```typescript
import { hasRole } from "./roles";

export type RouteAccessResult = "allow" | "redirect-login" | "forbidden";

export function resolveRouteAccess(
  pathname: string,
  session: { role: string } | null
): RouteAccessResult {
  const isAdminRoute = pathname.startsWith("/admin");
  const isStudentRoute = pathname.startsWith("/dashboard");

  if (!isAdminRoute && !isStudentRoute) {
    return "allow";
  }
  if (!session) {
    return "redirect-login";
  }
  if (isAdminRoute) {
    return hasRole(session, "admin") ? "allow" : "forbidden";
  }
  return hasRole(session, "student") ? "allow" : "forbidden";
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- src/lib/route-access.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `src/middleware.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveRouteAccess } from "@/lib/route-access";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const decision = resolveRouteAccess(
    request.nextUrl.pathname,
    session?.user ? { role: (session.user as { role: string }).role } : null
  );

  if (decision === "redirect-login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (decision === "forbidden") {
    return NextResponse.redirect(new URL("/403", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
```

- [ ] **Step 6: Write placeholder pages**

```tsx
// src/app/403/page.tsx
export default function ForbiddenPage() {
  return <p className="p-8">You don't have access to this page.</p>;
}
```

```tsx
// src/app/admin/page.tsx
export default function AdminHome() {
  return <p className="p-8">Admin dashboard (placeholder — built out in Admin: Setup).</p>;
}
```

```tsx
// src/app/dashboard/page.tsx
export default function StudentHome() {
  return <p className="p-8">Student dashboard (placeholder — built out in Student: Voting Flow).</p>;
}
```

- [ ] **Step 7: Manually verify**

Run: `npm run dev`.
- Visit `/admin` while signed out → redirected to `/login`.
- Sign in as the seeded admin (Task 7), visit `/admin` → placeholder page renders.
- While still signed in as admin, visit `/dashboard` → redirected to `/403`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/route-access.ts src/lib/route-access.test.ts src/middleware.ts src/app/403 src/app/admin src/app/dashboard
git commit -m "feat: add role-based route protection middleware"
```

---

## Definition of done

- [ ] `npm run test` passes with all tests from Tasks 2–9 green.
- [ ] `npm run db:push` has been run against the real Neon dev database with no errors.
- [ ] `npm run db:seed` has created one working admin account.
- [ ] Manual check: admin can log in at `/login` and reach `/admin`; the same admin is redirected away from `/dashboard`; signed-out visitors to either are redirected to `/login`.
