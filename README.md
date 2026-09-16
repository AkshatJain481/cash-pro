# Cash Pro

Receipts & payments ledger, calendar with reminders, tasks, to-dos and net worth by liquidity — the original single-file Cash Pro app rebuilt with Next.js, shadcn/ui, Google sign-in and a CockroachDB database.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 + shadcn/ui · Better Auth (Google) · Prisma 7 + CockroachDB · Zustand · zod

## Setup

### 1. Install

```bash
npm install          # also runs `prisma generate`
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill it in:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | CockroachDB connection string |
| `BETTER_AUTH_SECRET` | Random string, at least 32 characters (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Public URL of the app, e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

The Prisma CLI reads the same `.env` / `.env.local` files as Next.js.

### 3. Google OAuth client

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials): **Create credentials → OAuth client ID → Web application**.

- **Authorized JavaScript origins:** `http://localhost:3000` (plus your production URL)
- **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google` (plus `https://<your-domain>/api/auth/callback/google`)

While the OAuth consent screen is in _Testing_, add your Google account as a test user.

### 4. Database (CockroachDB)

**CockroachDB Cloud:** create a cluster and a SQL user, then copy the connection string (it ends with `sslmode=verify-full`) into `DATABASE_URL`.

**Or locally with Docker:**

```bash
docker run -d --name cockroach -p 26257:26257 cockroachdb/cockroach:latest-v26.2 start-single-node --insecure
docker exec cockroach ./cockroach sql --insecure -e "CREATE DATABASE cashpro"
# DATABASE_URL="postgresql://root@localhost:26257/cashpro?sslmode=disable"
```

Then create the tables:

```bash
npm run db:deploy    # applies prisma/migrations
```

When you change `prisma/schema.prisma`, create a new migration with `npm run db:migrate -- --name <change>`.

> CockroachDB 26+ creates tables _schema locked_, which stops a migration from adding indexes and foreign keys to them. `prisma.config.ts` turns that off for Prisma CLI connections, so `DATABASE_URL` needs no extra options. If a migration ever fails partway, drop the objects it created, run `npx prisma migrate resolve --rolled-back <migration_name>`, then deploy again.

### 5. Run

```bash
npm run dev          # http://localhost:3000
```

## Moving data from the old HTML app

In the old app: tap the logo → **Download JSON Backup**. In Cash Pro: tap the logo → **Restore from JSON backup**. Both apps use the same backup format, so files work in either direction.

## How it's built

- **Auth** — Better Auth with Google (`lib/auth.ts`, `app/api/auth/[...all]`). Sessions live in the database; `proxy.ts` redirects signed-out visitors to `/login`, and every page and server action re-checks the session.
- **Data** — `app/page.tsx` loads the user's data on the server and hands it to a Zustand store (`components/cash-pro/store.tsx`). Changes apply instantly in the UI and are saved through server actions (`lib/actions/*`), which validate input with zod and scope every query to the signed-in user.
- **Logic** — insights, liquidity tiers, the daily fund summary, CSV/JSON export and restore are plain functions in `lib/cash-pro/*`.

### Database schema

See `prisma/schema.prisma`. Highlights:

- `users`, `sessions`, `accounts`, `verifications` — managed by Better Auth
- `money_entries`, `events`, `tasks`, `todos`, `assets`, `backup_logs` — app data, each with a composite primary key `(user_id, id)` so a user's rows sit together and are always queried by owner
- Money is `DECIMAL(15,2)`, days are `DATE`, event times are `TIME`, statuses/categories are enums; `CHECK` constraints keep amounts positive
- The "Cash Balance" asset isn't stored — it's derived from cash-mode receipts and payments

Prisma Studio doesn't support CockroachDB; use the CockroachDB console or `cockroach sql` to browse data.

## Deploying

Set the environment variables on your host (use the production URL for `BETTER_AUTH_URL`), add the production redirect URI to the Google OAuth client, and run `npm run db:deploy` against the production database before the first release. `npm run build` runs `prisma generate` automatically.
