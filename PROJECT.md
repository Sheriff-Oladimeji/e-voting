# Project: University Electronic Voting System

## What This Is
A web-based platform that digitizes university student elections end-to-end — from election setup to result publication. Equal emphasis on security AND user experience: students vote confidently and quickly, admins manage the whole election from one dashboard. Replaces manual paper-based voting.

## Scope Note
This is a **final-year university project, not a startup**. Keep implementation simple and readable. Do not add: 2FA, growth/analytics infra, over-engineered auth flows, or extra tooling beyond what's listed below. Favor straightforward code over premature scaling.

## Tech Stack
- **Next.js 16** — fullstack (frontend + API/server actions)
- **shadcn/ui** — UI components
- **Zustand** — client-side state (search/filter, vote-in-progress state)
- **PostgreSQL (via Neon)** — database
- **Drizzle ORM** — database schema + queries
- **Better Auth** — authentication (matric number + password, no social login needed)
- **Resend** — email, password reset only (no OTP signup, no notifications needed)

## Modules

### Student Module
- Login (matric number + password)
- View candidates (per election, per position)
- Cast vote (one per position, enforced at DB level — unique constraint, not just app logic)
- Receive confirmation (instant, unambiguous)

### Admin Module
- Manage students (CSV import, eligibility by faculty/department)
- Manage candidates (add/edit/remove, per election/position, photo + manifesto)
- Create elections (title, positions, start/end time)
- View results (tally by position, turnout by faculty/department)
- Generate reports (exportable, PDF/CSV)

### Database
- Student records
- Candidate records
- Votes — **anonymized**, not directly linked to student identity
- Election data

## Key UX Requirements
- **Smart Search** — filter candidates by name, faculty, or department. Client-side, instant, no network round-trip.
- **Confirmation Feedback** — explicit "✓ Vote Successfully Submitted" message with a reference code after every vote. Never leave the student wondering if it worked.
- Clean, modern, mobile-responsive, accessible (WCAG AA) UI throughout.

## Non-negotiables
- One vote per student per position — enforced via DB unique constraint (`student_id + position_id`), inside the same transaction as the vote write.
- Votes are anonymized — no direct foreign key from a vote to a student's identity.
- Votes are insert-only — no update/delete path once cast.
- Election window enforced server-side (votes only accepted while election status is `active`).
- HTTPS only, CSRF protection on all mutating routes.
