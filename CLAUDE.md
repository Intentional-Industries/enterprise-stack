---
autocto_commit: ef36b717d011b204e8145ee8edecfc7a211df450
autocto_generated: 2026-07-06T10:22:55.178Z
---

# CLAUDE.md

## Project Overview

A production-grade Next.js 14 web application deployed on AWS using infrastructure-as-code (Terraform). The stack implements defense-in-depth security, high availability, and full network segregation suitable for regulated enterprises. One-command deployment (`./up`) provisions everything from VPC to CloudFront; one-command teardown (`./down`) destroys all resources with no orphans. **Local development** via `./dev` runs the same app against Docker Postgres + cognito-local emulator with hot-reload, requiring no AWS account.

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router), TypeScript, React
- **Database**: PostgreSQL on RDS (multi-AZ) or local Docker Postgres (via `./dev`)
- **Auth**: AWS Cognito (user pool + client, V1 auto-confirms users) or cognito-local emulator
- **Compute**: ECS Fargate in private subnets (no public IPs)
- **CDN/WAF**: CloudFront with AWS WAF (managed rules: Common, KnownBadInputs, SQLi)
- **IaC**: Terraform ≥1.7 with modular structure
- **Testing**: 
  - Playwright (TypeScript) for local E2E tests (targets `http://localhost:3000`)
  - Playwright acceptance suite for live AWS deployment testing (`acceptance/` directory)
- **Secrets**: AWS Secrets Manager (RDS credentials rotated by AWS, app secrets stored)
- **Encryption**: KMS CMK for RDS, S3, CloudWatch Logs
- **Observability**: CloudWatch Logs, AWS Config continuous compliance
- **Container Registry**: ECR with enhanced scanning
- **Node.js**: ≥20 LTS
- **Docker**: Multi-stage build (production image) + compose for local dev

## Project Structure

```
/
├── up                      # Orchestration: prereqs → backend → TF → build → deploy → migrate → test
├── down                    # Teardown: `terraform destroy`, optionally purges state backend
├── dev                     # Local dev: starts Postgres + cognito-local + Next.js (no AWS)
├── test                    # Wrapper for acceptance suite (runs Playwright)
├── docker-compose.yml      # Postgres + cognito-local containers for local dev
├── LOCAL_DEV.md            # Guide: how to run the app locally without AWS
├── package.json            # Root package: E2E test dependencies (@playwright/test)
├── playwright.config.ts    # E2E test config: baseURL http://localhost:3000, testDir ./e2e
├── e2e/                    # Local E2E tests (run during development)
│   ├── smoke.spec.ts       # Basic smoke test: homepage loads with non-empty title
│   └── tasks/              # Evaluator-generated test files (immutable, verify task completion)
├── e2e.md                  # Documentation for E2E testing setup and usage
├── scripts/
│   └── check-prereqs.sh    # Validates AWS CLI, Terraform, Docker, Node.js, jq versions
├── terraform/
│   ├── main.tf             # Root module: calls all child modules
│   ├── variables.tf        # Stack inputs (project, environment, region, etc.)
│   ├── outputs.tf          # Exports CloudFront URL, ECR repo, Cognito IDs, DB secret ARN
│   ├── versions.tf         # Provider version constraints
│   ├── backend.tf.example  # Template for S3 state backend (created by ./up bootstrap)
│   ├── environments/dev/   # Environment-specific tfvars
│   └── modules/
│       ├── network/        # VPC (3-tier: public, private, data), NAT, VPC endpoints
│       ├── security/       # KMS CMK, security groups
│       ├── data/           # RDS PostgreSQL (multi-AZ, encrypted), Secrets Manager
│       ├── identity/       # Cognito User Pool + Client (auto-confirm in V1)
│       ├── compute/        # ECR, ECS cluster/service/task, ALB (HTTP:80), IAM roles
│       ├── edge/           # CloudFront distribution, WAF WebACL
│       └── observability/  # CloudWatch log groups, AWS Config, S3 audit bucket (Object Lock COMPLIANCE)
├── app/
│   ├── src/app/            # Next.js App Router: pages + API routes
│   │   ├── page.tsx        # Landing page (reads "hello_value" from DB)
│   │   ├── api/
│   │   │   ├── hello/route.ts      # Returns DB row from "hello_table"
│   │   │   ├── auth/signin/route.ts
│   │   │   ├── auth/signout/route.ts
│   │   │   ├── auth/signup/route.ts
│   │   │   └── health/route.ts
│   │   ├── auth/
│   │   │   ├── signin/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── profile/page.tsx        # Protected: displays Cognito sub/email
│   │   ├── layout.tsx              # Root layout with header (nav with "Intentional Industries" text, white font, gradient background)
│   │   ├── not-found.tsx
│   │   └── globals.css             # Global styles including header styles (.site-header, .site-title with white color and gradient)
│   ├── src/lib/
│   │   ├── db.ts           # PostgreSQL connection pool (reads credentials from env or Secrets Manager)
│   │   ├── cognito.ts      # AWS SDK v3 CognitoIdentityProvider client (points at cognito-local if COGNITO_ENDPOINT set)
│   │   └── session.ts      # Session token parsing/validation (JWT from Cognito)
│   ├── src/instrumentation.ts  # Next.js instrumentation hook (DB init, pre-warm)
│   ├── migrations/
│   │   └── 001_init.sql    # Creates "hello_table" with one row
│   ├── scripts/
│   │   ├── migrate.js              # Node.js script: runs SQL files against DB (invoked by ECS one-off task or `npm run migrate`)
│   │   └── cognito-local-setup.js  # Provisions local Cognito pool on first `./dev` run
│   ├── .env.local.example  # Template for local dev environment variables
│   ├── .gitignore          # Ignores .env.local, .cognito-local.json, node_modules/, .next/
│   ├── .cognito-local.json # (gitignored) cached pool ID/client ID for cognito-local
│   ├── Dockerfile          # Multi-stage: build → prune → runtime (Node.js 20 Alpine)
│   ├── package.json        # Dependencies: next, react, pg, @aws-sdk/*, jose, cookie
│   └── next.config.ts      # Next.js config (standalone output for Docker)
├── acceptance/
│   ├── specs/v1-acceptance.spec.ts  # 5-test suite: homepage → API → signup → signin → profile
│   ├── playwright.config.ts         # Acceptance test config (targets live AWS deployment)
│   ├── package.json
│   └── screenshots/         # Test artefacts
└── .autocto/
    ├── run-config.json      # AutoCTO harness: how to install/start this app (commit-keyed)
    ├── init.sh              # Startup script run before every generator task
    ├── feature_list.json    # Current run's task list (agent-facing source of truth)
    ├── progress.md          # Cumulative history of AutoCTO runs on this repo
    ├── handoff-*.json       # Per-task handoff artifacts (files changed, commands run, notes)
    └── pw-results/          # Playwright test execution results (JSON reports, .last-run.json status)
```

## Entry Points & How It Starts

### Full stack (AWS): `./up`
1. Checks prerequisites (`scripts/check-prereqs.sh`)
2. Bootstraps S3 + DynamoDB Terraform state backend (idempotent)
3. Applies Terraform phase 1 (creates ECR repository)
4. Builds Docker image: `docker build -t <ecr-url>:latest app/`
5. Pushes to ECR
6. Applies full Terraform stack
7. Runs DB migrations via one-off ECS task (`aws ecs run-task` → `migrate.js`)
8. Waits for ECS service healthy (polls ALB target health)
9. Outputs CloudFront URL
10. Runs `./test` against live deployment

### Local dev (no AWS): `./dev`
1. Creates `app/.env.local` from `.env.local.example` if missing
2. Starts Docker containers: `docker compose up -d db cognito` (Postgres + cognito-local)
3. Waits for Postgres healthcheck to pass
4. Runs `npm install` in `app/` (if `node_modules/` missing)
5. Runs `npm run migrate` (applies `migrations/*.sql` to local DB)
6. Runs `npm run cognito:setup` → `scripts/cognito-local-setup.js` (provisions local user pool, caches IDs in `.cognito-local.json`, writes to `.env.local`)
7. Starts `npm run dev` (Next.js dev server, defaults to `:3000` or auto-increments to next free port)

### E2E tests (local development)
- Run `npm run test:e2e` from repo root to execute Playwright tests against `http://localhost:3000`
- Requires app to be running (via `./dev`)
- Smoke test in `e2e/smoke.spec.ts` verifies homepage loads with non-empty title
- Test files in `e2e/tasks/` are evaluator-generated (immutable) and verify task completion
- See `e2e.md` for detailed testing documentation

### Next.js app (both modes)
- Container (AWS) or `npm run dev` (local) starts with `CMD ["node", "server.js"]` or `next dev`
- `src/instrumentation.ts` runs before requests (initializes DB pool, reads secrets/env vars)
- ALB health check (AWS): `GET /api/health` → 200 if DB query succeeds
- CloudFront forwards requests with custom header (AWS); ALB rejects all other traffic

### DB migrations
- `scripts/migrate.js` reads all `migrations/*.sql` (sorted), executes sequentially
- Run once per deployment (AWS: ECS task; local: `npm run migrate` or triggered by `./dev`)

## Data Models & Core Domain

- **`hello_table`** (PostgreSQL): Single table with `id` (serial PK), `hello_value` (text). Seeded with one row: `"hello from the database"`. Used to prove DB connectivity.
- **Cognito User Pool**: Stores user accounts. V1 auto-confirms users on signup (no email verification). JWT access tokens used for session validation.
- **Session**: Stateless JWT. `lib/session.ts` parses Cognito tokens from cookies/headers, extracts `sub` (user ID) and `email`.
- **Secrets Manager** (AWS only):
  - `/intentional/dev/rds` (RDS-managed): `username`, `password`, `host`, `port`, `dbname`
  - `/intentional/dev/external-services` (placeholder for V2): API keys for Sentry, PostHog, etc.
- **Local dev**: No Secrets Manager; credentials in `app/.env.local` (gitignored)

## Key Conventions & Constraints

### Header Styling (Current State)
- **Header text**: Displays "Intentional Industries" in `app/src/app/layout.tsx` (line 24, nav element with className="brand")
- **Font color**: White (`color: white` in `.site-header` and `color: #ffffff` in `.site-title`)
- **Background**: Horizontal gradient `linear-gradient(to right, #000000, #001f3f)` on `.site-header` (black to navy blue)
- **CSS location**: All header styles defined in `app/src/app/globals.css` (lines 41-48)

### AWS-specific
- **Network segregation**: App runs in private subnets; no direct internet access. VPC endpoints (`ecr.dkr`, `logs`, `secretsmanager`) allow AWS API calls without NAT traversal.
- **CloudFront ↔ ALB authentication**: ALB security group + custom header check (`X-CloudFront-Secret`) ensures ALB only accepts CloudFront traffic. CloudFront uses default `*.cloudfront.net` TLS cert (V1).
- **Environment variables** (runtime, injected into ECS task):
  - `DATABASE_SECRET_ARN`: ARN of RDS secret in Secrets Manager
  - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`
  - `AWS_REGION`, `NODE_ENV=production`
- **Auto-confirm workaround (V1)**: `api/auth/signup` calls `AdminConfirmSignUp` after `SignUp` to bypass email verification (SES not configured).

### Local dev-specific (see LOCAL_DEV.md)
- **Environment variables** (`app/.env.local`, gitignored):
  - `DB_HOST=localhost`, `DB_PORT=5433` (not 5432 to avoid collision with existing Postgres)
  - `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` (matches `docker-compose.yml` defaults)
  - `DB_SSL=false` (local Postgres doesn't speak TLS; AWS RDS does)
  - `COGNITO_ENDPOINT=http://localhost:9229` (points SDK at cognito-local instead of AWS)
  - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID` (written by `cognito:setup` script, cached in `.cognito-local.json`)
  - `SESSION_SECRET` (any string ≥32 chars)
  - `NEXTAUTH_URL=http://localhost:3000` (update to match actual port if Next.js falls back to 3001+)
- **cognito-local**: Unofficial emulator, not AWS-maintained. Supports `SignUp`, `AdminConfirmSignUp`, `InitiateAuth`, `GetUser` (all this app needs). Data persists in Docker volume `cognito-data` until `docker compose down -v`.
- **Port auto-increment**: `next dev` defaults to `:3000`; if taken, tries `:3001`, `:3002`, etc. Watch terminal output for `Local: http://localhost:XXXX`.
- **No Secrets Manager**: DB credentials from `app/.env.local`; `lib/db.ts` reads them directly.

### Testing-specific
- **E2E vs Acceptance**: 
  - E2E tests (`e2e/`) run locally against `http://localhost:3000` during development
  - Acceptance tests (`acceptance/`) run against live AWS deployment with real Cognito/RDS
- **Test isolation**: E2E smoke test is minimal and doesn't require authentication; acceptance suite performs full user flows
- **data-testid convention**: All interactive UI elements should have `data-testid` attributes for reliable test targeting
- **Evaluator-generated tests**: Files in `e2e/tasks/` are immutable verification tests created by the AutoCTO evaluator to validate task completion. Do not modify these files; fix implementation if tests fail.
- **Task verification tests**: Current evaluator-generated tests in `e2e/tasks/` include:
  - `task-01-update-header-text-to-intentional-industries.spec.ts`: Verifies header text is "Intentional Industries"
  - `task-02-apply-white-font-color-to-header.spec.ts`: Verifies header has white font color
  - `task-03-add-horizontal-gradient-background-to-header.spec.ts`: Verifies header has black-to-navy gradient background

### Shared conventions
- **DB connection pooling**: `lib/db.ts` uses `pg.Pool` with max 10 (local) or 20 (AWS) connections. Connection string constructed from env vars (local) or Secrets Manager (AWS) on app startup.
- **Idempotency**: Re-running `./up` or `./dev` converges; does
