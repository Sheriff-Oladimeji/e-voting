# Foundation — Design Spec

Sub-project 1 of 4 for the University Electronic Voting System (see `PROJECT.md` for full product scope). This piece establishes the database schema, authentication, and project shell that every later sub-project (Admin: Setup, Student: Voting Flow, Admin: Results & Reporting) depends on.

## Why this is first

Nothing else in the system can be built or demoed without a working schema and login. Decomposing here rather than planning the whole system at once keeps each spec small enough to implement and review confidently.

## Architecture

- **Next.js 16** App Router. All mutations go through server actions — no separate REST/API layer.
- **Drizzle ORM** against **Neon Postgres**.
- **Better Auth**, configured with the core `emailAndPassword` plugin plus the `username` plugin, so students and admins log in with matric number (mapped to `username`), not email. `email` is retained on every account for password-reset/invite delivery via **Brevo**, but is never shown at login.
- Route groups split `/admin/*` (admin-only) from student-facing routes, each enforced by middleware — not just page-level checks.
- `Zustand` is out of scope for Foundation; it's introduced in the Student Voting Flow sub-project for search/filter and vote-in-progress state.

## Data model

One shared `user` table (Better Auth's table, extended) rather than separate student/admin tables — role is just a field, and splitting tables would add join complexity with no real benefit at this scale.

```
user
  id            uuid, pk
  email         text, unique      -- used only for password-reset/invite email, never shown at login
  username      text, unique      -- matric number; what the person actually types to log in
  passwordHash  text              -- managed by Better Auth
  role          enum('student','admin')
  name          text
  faculty       text, nullable    -- null for admins
  department    text, nullable    -- null for admins
  createdAt     timestamp

election
  id                    uuid, pk
  title                 text
  status                enum('draft','active','closed')
  startAt               timestamp
  endAt                 timestamp
  eligibleFaculties     text[], nullable   -- null/empty = open to all faculties
  eligibleDepartments   text[], nullable   -- null/empty = open to all departments

position
  id           uuid, pk
  electionId   uuid, fk -> election
  title        text

candidate
  id           uuid, pk
  positionId   uuid, fk -> position
  name         text
  photoUrl     text
  manifesto    text

ballot                                     -- proves a student voted; carries no candidate info
  id           uuid, pk
  studentId    uuid, fk -> user
  electionId   uuid, fk -> election
  positionId   uuid, fk -> position
  votedAt      timestamp
  UNIQUE (studentId, positionId)

vote                                       -- the anonymous tally; no link to identity, ever
  id           uuid, pk
  positionId   uuid, fk -> position
  candidateId  uuid, fk -> candidate
  castAt       timestamp
```

Casting a vote is a single DB transaction that inserts one `ballot` row and one `vote` row. The `ballot` unique constraint is what makes "one vote per student per position" a DB-level guarantee (per `PROJECT.md`'s non-negotiables), not just app logic. `vote` never stores a student reference, satisfying the anonymization requirement — there is no code path that could join a `vote` row back to a student even by accident, because the column doesn't exist.

Election eligibility (`eligibleFaculties` / `eligibleDepartments`) is OR'd: a student is eligible if their faculty is in the election's faculty list, OR their department is in the election's department list. Empty/null on both means the election is open to every student. This covers both faculty-wide and department-specific elections without a separate rules table.

## Auth & password flows

- **Login**: matric number + password. No social login, no 2FA (per `PROJECT.md` scope note).
- **Admin accounts**: seeded manually (a fixed, small set) — no admin signup UI.
- **Student accounts**: created via CSV import (built in the next sub-project, Admin: Setup) with role `student`, a random unusable password, and their real email pulled from the CSV.
- **Initial password / invite flow**: immediately after a student `user` row is inserted, Better Auth's reset-password token flow fires via Brevo, framed as "Set your password" (same underlying mechanism as a regular password reset, different email copy).
- **Password reset**: standard Better Auth forgot-password flow, also delivered via Brevo, available to both students and admins.
- **Route protection**: middleware checks session + role before rendering `/admin/*` or student routes. No session → redirect to login. Wrong role → 403 page.
- **Election-window enforcement**: the vote-casting server action re-checks `election.status === 'active'` and that the current time falls within `startAt`/`endAt` server-side, before writing — never trusts client-supplied state (per `PROJECT.md` non-negotiables).
- **CSRF**: covered by Next.js server actions' built-in origin checking — no separate CSRF token layer needed. **HTTPS**: a deployment/hosting concern (enforced by the platform, e.g. Vercel), not application code — out of scope for this spec.

## Error handling

Server actions return a typed result — `{ success: true, data } | { success: false, error }` — rather than throwing, so the UI can show a specific, friendly message instead of falling back to a generic error boundary. The one case this matters most for in Foundation: a duplicate `ballot` insert (Postgres unique-violation) is caught and mapped to a clear "You've already voted for this position" error rather than a raw DB error.

## Testing

Scoped to where a bug would be a real incident, not blanket coverage — matches the project's "keep it simple" directive:
- **Vitest**, DB-backed: assert the `ballot` unique constraint actually rejects a second vote for the same `(studentId, positionId)`, and that `vote` rows have no student-identifying column.
- **Vitest**, pure logic: role-check helpers and the election-window check, tested without a DB.
- No E2E framework yet — that's more valuable once the student voting UI exists, in the next sub-project.

## Out of scope for this sub-project

- CSV import UI/logic, candidate management, election creation UI (Admin: Setup)
- Vote casting UI, smart search, confirmation screen (Student: Voting Flow)
- Results tallying, turnout stats, PDF/CSV export (Admin: Results & Reporting)

## Open questions

None — all decisions above were confirmed during brainstorming.
