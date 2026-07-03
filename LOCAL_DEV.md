# Local Development

Run the Next.js app against a local Postgres container and a local Cognito
emulator — no AWS account, no Terraform. This is for iterating on the app
itself (pages, API routes, DB schema, auth flows). Use `./up` when you need
the real AWS stack (CloudFront/WAF, real Cognito, full acceptance suite).

## What you get

- The Next.js app at `http://localhost:3000`, hot-reloading (`next dev`).
  If port 3000 is already in use, Next.js automatically falls back to the
  next free port (3001, 3002, ...) and prints a warning with the URL it
  picked — watch the terminal output for the actual `Local:` address.
- A local Postgres 16 container, migrated with `app/migrations/*.sql`
- A local Cognito emulator ([cognito-local](https://github.com/jagregory/cognito-local))
  with a user pool + client provisioned automatically — `/auth/signup`,
  `/auth/signin`, and `/profile` all work fully offline.
- The homepage, `/api/hello`, and `/api/health` — all work fully offline too.

## Caveat: cognito-local is not real Cognito

`cognito-local` is an unofficial, community-maintained emulator, not an AWS
product — see [its README](https://github.com/jagregory/cognito-local#feature-support)
for what's fully vs. partially supported (this app only needs `SignUp`,
`AdminConfirmSignUp`, `InitiateAuth` with `USER_PASSWORD_AUTH`, and `GetUser`,
all of which work). It's fine for day-to-day iteration, but the real
acceptance gate is still `./up` + `./test` against a real Cognito pool — treat
a local pass as a good sign, not a substitute for that.

To instead point the app at a **real** Cognito pool while developing locally
(e.g. one already stood up by `./up`), comment out `COGNITO_ENDPOINT` in
`app/.env.local`, set `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` to the real
pool's values, and make sure your shell has AWS credentials that can call it.

## Prerequisites

- Docker (with `docker compose`)
- Node.js ≥ 20 LTS

## Quick start

```bash
./dev
```

This does everything in order:
1. Copies `app/.env.local.example` → `app/.env.local` (if it doesn't already exist)
2. Starts the Postgres and cognito-local containers (`docker-compose.yml`), waits for Postgres to be healthy
3. `npm install` in `app/` (if `node_modules` is missing)
4. Runs DB migrations (`npm run migrate`)
5. Provisions the local Cognito user pool + client (`npm run cognito:setup`) and
   writes `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` into `app/.env.local` —
   idempotent, reuses the same pool on subsequent runs
6. Starts `next dev` in the foreground

Ctrl-C stops the app; the DB and cognito-local containers keep running in the
background (`docker compose ps` / `docker compose down` to stop them).

## Manual steps

If you'd rather run things yourself instead of `./dev`:

```bash
cp app/.env.local.example app/.env.local   # first time only

docker compose up -d db cognito

cd app
npm install
npm run migrate
npm run cognito:setup
npm run dev
```

## Resetting the database or Cognito pool

```bash
docker compose down -v          # drops both containers and their volumes
rm -f app/.cognito-local.json   # drop the cached pool/client IDs too
./dev                           # recreates everything from scratch
```

## Environment variables

`app/.env.local.example` is the template (copy to `.env.local`, which is
gitignored). Defaults match `docker-compose.yml`:

| Variable         | Default                                        | Notes                                    |
|------------------|-------------------------------------------------|-------------------------------------------|
| `DB_HOST`        | `localhost`                                     |                                            |
| `DB_PORT`        | `5433`                                          | Not 5432 — avoids clashing with a Postgres you may already have running locally |
| `DB_NAME`        | `intentional`                                   |                                            |
| `DB_USERNAME`    | `intentional_admin`                             |                                            |
| `DB_PASSWORD`    | `changeme`                                      |                                            |
| `DB_SSL`         | `false`                                         | Local Postgres doesn't speak TLS; production RDS does (`ssl: {rejectUnauthorized: false}` is the default in `src/lib/db.ts` unless this is `false`) |
| `SESSION_SECRET` | dev placeholder                                 | Any string ≥ 32 chars                     |
| `COGNITO_ENDPOINT` | `http://localhost:9229`                       | Points the AWS SDK at cognito-local instead of real AWS; unset this to use a real pool |
| `COGNITO_PORT`   | `9229`                                          | cognito-local's port                      |
| `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` | written by `npm run cognito:setup` | Don't set by hand unless pointing at a real pool |

## Troubleshooting

- **"role ... does not exist" / connects but wrong data**: something else on
  your machine is already listening on the Postgres port. Check with
  `lsof -nP -iTCP:5432 -sTCP:LISTEN` — if a native Postgres install owns 5432,
  that's why `DB_PORT` defaults to `5433` here. If 5433 is also taken, pick
  another port in `app/.env.local` and `docker-compose.yml` will pick it up.
- **App can't reach the DB / SSL error**: make sure `DB_SSL=false` is set in
  `app/.env.local` — it isn't set by default anywhere else, and without it
  the app tries to negotiate TLS with a container that doesn't support it.
- **Migrations run against a stale/half-initialised DB**: `docker compose
  down -v` to wipe the volume and start clean.
- **Auth routes fail with a Cognito error after `docker compose down -v`**:
  the cached pool in `app/.cognito-local.json` no longer exists (its volume
  was wiped). `npm run cognito:setup` (or just re-run `./dev`) detects this
  and recreates the pool automatically.
- **Signed-up users disappear**: cognito-local's data lives in the
  `cognito-data` Docker volume, not in your repo — `docker compose down`
  (without `-v`) keeps it; `-v` wipes it.
