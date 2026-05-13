# Bruin Service

UCLA CS35L group project. Vite + React frontend, Express API server, Neon Postgres database.

## Repo layout

```
client/   Vite + React app
server/   Express API + Neon database client
  migrations/  SQL migrations (run in filename order)
  scripts/     migrate.js, seed.js
```

## Prerequisites

- Node.js 20+
- npm 10+
- Access to the team's Vercel project (ask Saanvi to be added) — the database is a Neon Postgres instance provisioned through Vercel.

## First-time setup

### 1. Install dependencies

From the repo root:

```bash
npm install
```

This installs workspaces for both `client/` and `server/`.

### 2. Pull database credentials from Vercel

The Neon `DATABASE_URL` lives in Vercel's environment variables — do **not** commit it. Pull it into a local env file:

```bash
npm i -g vercel        # if you don't already have the CLI
vercel login           # use the account that has access to the project
vercel link            # select the existing "bruin-service-cs35l" project
vercel env pull .env.development.local
```

After this, `.env.development.local` should contain `DATABASE_URL=postgres://...` (plus a few related Neon vars). It's already gitignored.

If you don't have Vercel access, ask a teammate to send you the `DATABASE_URL` and paste it into `.env.development.local` manually:

```
DATABASE_URL=postgres://<user>:<password>@<host>/<db>?sslmode=require
```

### 3. Run migrations

This creates the `users`, `listings`, and `bookings` tables:

```bash
npm run db:migrate --workspace=server
```

Migrations are idempotent (`CREATE TABLE IF NOT EXISTS`), so it's safe to re-run.

### 4. Seed sample data

Loads the sample listings used by the booking and listing-detail pages:

```bash
npm run db:seed --workspace=server
```

Re-running won't duplicate rows (`ON CONFLICT (id) DO NOTHING`).

## Running the app

From the repo root:

```bash
npm run dev
```

This starts both the API server and the Vite dev server concurrently. You can also run them separately:

```bash
npm run dev:server
npm run dev:client
```

## Adding a new migration

1. Create a new file in `server/migrations/` with the next number, e.g. `002_add_something.sql`.
2. Write idempotent SQL (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, etc.).
3. Run `npm run db:migrate --workspace=server`.

Files run in filename order, so prefix with a zero-padded number.

## Schema overview

- `users` — id (uuid), email, password_hash, name, created_at
- `listings` — id (text), provider_id (→ users), name, category, location, description, price, duration, photos/services/available_dates/reviews (jsonb)
- `bookings` — id (uuid), listing_id (→ listings), user_id (→ users), date, time, customer_name, customer_email, status

See `server/migrations/001_init.sql` for the source of truth.

## Troubleshooting

- **`DATABASE_URL is not set`** — `.env.development.local` is missing or empty. Re-run `vercel env pull .env.development.local` from the repo root.
- **`password authentication failed`** — your `DATABASE_URL` is stale; pull it again from Vercel.
- **Migration says "extension pgcrypto does not exist"** — only happens on non-Neon Postgres; on Neon, `pgcrypto` is preinstalled.
