# University Electronic Voting System

Final-year project. See `PROJECT.md` for the full spec. This covers local setup for the **Foundation** piece (database, auth, login) that's currently built.

## Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) account (free tier is fine) — Postgres database
- A [Resend](https://resend.com) account (free tier is fine) — sends password-reset/invite emails

## 1. Install dependencies

```bash
npm install
```

## 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Then fill in `.env.local` with real values — here's where each one comes from:

### `DATABASE_URL`

1. Go to [neon.tech](https://neon.tech) and sign in (or create an account).
2. Create a new project (any name/region is fine).
3. On the project dashboard, find the **Connection string** box.
4. Copy the **pooled** connection string (it looks like `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require`).
5. Paste it as `DATABASE_URL`.

### `BETTER_AUTH_SECRET`

This is a random secret used to sign sessions — you generate it yourself, nothing to sign up for:

```bash
openssl rand -base64 32
```

Paste the output as `BETTER_AUTH_SECRET`.

### `BETTER_AUTH_URL`

Leave as `http://localhost:3000` for local dev. (Change this to your real domain when deploying.)

### `RESEND_API_KEY`

1. Go to [resend.com](https://resend.com) and sign in (or create an account).
2. In the dashboard, go to **API Keys** → **Create API Key**.
3. Give it any name, full access is fine for dev.
4. Copy the key (starts with `re_`) — it's only shown once.
5. Paste it as `RESEND_API_KEY`.

### `RESEND_SENDER_EMAIL`

The "from" address for reset/invite emails.

- **Quickest for local dev:** Resend gives every account a free `onboarding@resend.dev` address that works without any domain setup. Use `onboarding@resend.dev`.
- **For a real domain:** in the Resend dashboard, go to **Domains** → **Add Domain**, add the DNS records it gives you, wait for verification, then use an address on that domain (e.g. `noreply@yourdomain.com`).

### `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`

Not from any external service — just pick the credentials for your one admin account, e.g.:

```
SEED_ADMIN_USERNAME=admin001
SEED_ADMIN_EMAIL=you@example.com
SEED_ADMIN_PASSWORD=some-strong-password
```

## 3. Create the database tables

```bash
npm run db:generate   # generates SQL migration files from the schema
npm run db:push       # applies them to your Neon database
```

## 4. Create your admin account

```bash
npm run db:seed
```

This reads `SEED_ADMIN_USERNAME`/`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` from `.env.local` and creates one admin user. Safe to re-run — it skips creation if that username already exists.

## 5. Run it

```bash
npm run dev
```

Visit `http://localhost:3000/login` and sign in with your `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`. You should land on `/admin`. Visiting `/dashboard` while signed in as an admin should redirect you to `/403`; signing out and visiting either should redirect you to `/login`.

## Tests

```bash
npm run test
```

Most tests need `DATABASE_URL` set (steps 2–3 above) since they run against the real database — they clean up their own rows after each run.

## Everything else

Admin candidate/election management, the student voting flow, and results/reporting aren't built yet — `/admin` and `/dashboard` are placeholder pages for now.
