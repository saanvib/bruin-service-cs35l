# Bruin Service

UCLA CS35L group project — a marketplace where UCLA students can list and book services from one another. Vite + React frontend, Express API server, Neon Postgres database, Descope for authentication.

## Repo layout

```
client/                  Vite + React app
  src/
    components/          Navbar, CalendarPicker, PhotoGallery, RequireAuth, RequireRole
    constants/           shared constants (e.g. service categories)
    hooks/               useRole — reads roles from the Descope session JWT
    pages/               route components (Home, Login, Browse, ListingDetail,
                         ProviderProfile, Dashboard, Booking, Chat, SavedListings)
  tests/                 Playwright end-to-end tests (+ auth/ setup helpers)
server/                  Express API
  middleware/            auth.js — requireAuth / requireRole (Descope token validation)
  routes/                auth, listings, providers, dashboard, bookings, chat,
                         reviews, flags
  migrations/            SQL migrations (run in filename order)
  scripts/               migrate.js, seed.js
  db.js                  Neon Postgres client
  index.js               Express entrypoint
```

## Prerequisites

- Node.js 20+
- npm 10+
- Access to the team's Vercel project — the Neon Postgres database and the Descope
  project IDs are stored as Vercel environment variables.

## First-time setup

### 1. Install dependencies

From the repo root:

```bash
npm install
```

This installs workspaces for both `client/` and `server/`.

### 2. Pull environment variables from Vercel

The Neon `DATABASE_URL` and the Descope project IDs live in Vercel's environment
variables — do **not** commit them. Pull them into a local env file:

```bash
npm i -g vercel        # if you don't already have the CLI
vercel login           # use the account that has access to the project
vercel link            # select the existing "bruin-service-cs35l" project
vercel env pull .env.development.local
```

After this, `.env.development.local` (at the repo root) should contain:

- `DATABASE_URL=postgres://...` — Neon connection string (plus several related Neon/Postgres vars)
- `DESCOPE_PROJECT_ID=...` — used by the server middleware to validate sessions
- `VITE_DESCOPE_PROJECT_ID=...` — used by the client's Descope `AuthProvider`
- `DESCOPE_MANAGEMENT_KEY=...` — secret used by the Playwright test setup (see Tests)

Both the server and the Vite client read this single root file: the server scripts
pass `--env-file=../.env.development.local`, and `vite.config.js` sets `envDir: '../'`.
The file is already gitignored.

If you don't have Vercel access, ask a teammate to send you the values above and paste
them in manually:

```
DATABASE_URL=postgres://<user>:<password>@<host>/<db>?sslmode=require
DESCOPE_PROJECT_ID=<project-id>
VITE_DESCOPE_PROJECT_ID=<project-id>
DESCOPE_MANAGEMENT_KEY=<management-key>
```

### 3. Run migrations

This creates and evolves the schema (users, listings, bookings, reviews,
conversations, messages, flags, provider_profiles):

```bash
npm run db:migrate --workspace=server
```

Migrations are idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`,
etc.), so it's safe to re-run.

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

This starts both the API server and the Vite dev server concurrently:

- API server → `http://localhost:3001`
- Vite dev server → `http://localhost:5173`

The Vite dev server proxies `/api` requests to the API server (see `vite.config.js`),
so the frontend can call relative `/api/...` paths in development.

You can also run them separately:

```bash
npm run dev:server
npm run dev:client
```

## Authentication & roles

Auth is handled by **Descope**, not by the API server directly.

- The client wraps the app in Descope's `AuthProvider` (`client/src/main.jsx`) and sends
  the Descope session token on API requests.
- The server validates that token in `requireAuth` middleware and enforces roles with
  `requireRole(...)` (`server/middleware/auth.js`).
- There are two roles, `customer` and `provider`. The `useRole` hook
  (`client/src/hooks/useRole.js`) reads them from the session JWT, and `RequireAuth` /
  `RequireRole` guard the client routes.

The `/api/auth/login` and `/api/auth/logout` routes are currently stubs — login/logout
flow through the Descope SDK on the client.

Most API routes require a valid session; `/api/dashboard/*` additionally requires the
`provider` role.

## API routes (overview)

| Mount | Auth | Endpoints |
| --- | --- | --- |
| `/api/auth` | none | `POST /login`, `POST /logout` (stubs) |
| `/api/listings` | requireAuth | `GET /`, `GET /categories`, `GET /:id` |
| `/api/listings` (reviews) | requireAuth | `GET /:id/reviews`, `POST /:id/reviews` |
| `/api/listings` (flags) | requireAuth | `POST /:id/flag` |
| `/api/providers` | requireAuth | `GET /:id` (stub) |
| `/api/dashboard` | requireAuth + provider | `GET/POST /listings`, `PUT/DELETE /listings/:id`, `GET/PUT /profile` |
| `/api/bookings` | requireAuth | `GET /`, `GET /mine`, `GET /:id`, `POST /`, `DELETE /:id`, `PATCH /:id/cancel-provider` |
| `/api/chat` | requireAuth* | conversations + messages CRUD |

\* `/api/chat` is mounted without the global `requireAuth` guard; check the route file
before relying on its auth behavior.

## End-to-End Tests (Playwright)

End-to-end tests live in `client/tests/` and use Playwright. There is no `npm test`
script yet; run them from the `client/` workspace:

```bash
cd client
npx playwright install     # first time only, installs browsers
npx playwright test
```

**Key locations:**
- Test specs → `client/tests/*.spec.js`
- Auth setup → `client/tests/auth/global-setup.js`
- Playwright config → `client/playwright.config.js`

The test setup creates a temporary Descope test user and logs it in, so it needs a
**`DESCOPE_MANAGEMENT_KEY`** in addition to the project ID. Pull all required vars via
`vercel env pull .env.development.local` — never commit that file.
Playwright starts its own dev server with `VITE_TEST_MODE=true`.
## Adding a new migration

1. Create a new file in `server/migrations/` with the next number, e.g.
   `009_add_something.sql`.
2. Write idempotent SQL (`CREATE TABLE IF NOT EXISTS`,
   `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, etc.).
3. Run `npm run db:migrate --workspace=server`.

Files run in **filename order**, so prefix with a zero-padded number and keep prefixes
unique — there are currently two `008_` files, which is fragile; avoid adding to that.
Note that `migrate.js` splits each file on `;` followed by a newline, so keep one
statement per line ending in a semicolon and avoid semicolons mid-statement.

## Schema overview

- `users` — id (uuid), email, password_hash, name, created_at.
  *Note: auth now goes through Descope, so `password_hash` is no longer used.*
- `listings` — id (text), provider_id (text — holds Descope user IDs), name, category,
  location, description, price, duration, taken_down (bool),
  photos/services/available_dates/reviews (jsonb), created_at
- `bookings` — id (uuid), listing_id (→ listings), user_id, date, time, customer_name,
  customer_email, status (defaults to `confirmed`), created_at
- `reviews` — id (uuid), listing_id (→ listings), user_id, rating (1–5), comment,
  created_at; one review per (listing, user)
- `conversations` — id (uuid), customer_id, provider_id, listing_id (→ listings),
  listing_name, created_at; unique per (customer, provider, listing)
- `messages` — id (uuid), conversation_id (→ conversations), sender_id, sender_name,
  body, created_at
- `flags` — id (uuid), listing_id (→ listings), user_id, created_at; unique per
  (listing, user)
- `provider_profiles` — provider_id (text, pk), bio, name

The migrations in `server/migrations/` are the source of truth; `001_init.sql` is the
baseline and `002`–`008` evolve it.

## Troubleshooting

- **`DATABASE_URL is not set`** — `.env.development.local` is missing or empty. Re-run
  `vercel env pull .env.development.local` from the repo root.
- **`password authentication failed`** — your `DATABASE_URL` is stale; pull it again
  from Vercel.
- **401 / "Invalid token" on API calls** — the Descope session is missing or expired,
  or `DESCOPE_PROJECT_ID` / `VITE_DESCOPE_PROJECT_ID` aren't set. Re-pull env vars and
  make sure you're logged in on the client.
- **403 / "Forbidden"** — you're authenticated but lack the required role (e.g. hitting
  a `/api/dashboard` route without the `provider` role).
- **Playwright auth setup fails** — `DESCOPE_MANAGEMENT_KEY` is missing or stale;
  re-run `vercel env pull .env.development.local` (see the Tests section).
- **Migration says "extension pgcrypto does not exist"** — only happens on non-Neon
  Postgres; on Neon, `pgcrypto` is preinstalled.
