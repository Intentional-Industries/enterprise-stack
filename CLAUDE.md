---
autocto_commit: 53684202365b34ae6b0a3182e3dd733402e7ed8a
autocto_generated: 2026-07-01T13:19:13.473Z
---

# CLAUDE.md

## Project Overview

A production-grade Next.js 14 web application deployed on AWS using infrastructure-as-code (Terraform). The stack implements defense-in-depth security, high availability, and full network segregation suitable for regulated enterprises. One-command deployment (`./up`) provisions everything from VPC to CloudFront; one-command teardown (`./down`) destroys all resources with no orphans.

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router), TypeScript, React
- **Database**: PostgreSQL on RDS (multi-AZ)
- **Auth**: AWS Cognito (user pool + client, V1 auto-confirms users)
- **Compute**: ECS Fargate in private subnets (no public IPs)
- **CDN/WAF**: CloudFront with AWS WAF (managed rules: Common, KnownBadInputs, SQLi)
- **IaC**: Terraform ≥1.7 with modular structure
- **Testing**: Playwright (TypeScript) for end-to-end acceptance tests
- **Secrets**: AWS Secrets Manager (RDS credentials rotated by AWS, app secrets stored)
- **Encryption**: KMS CMK for RDS, S3, CloudWatch Logs
- **Observability**: CloudWatch Logs, AWS Config continuous compliance
- **Container Registry**: ECR with enhanced scanning
- **Node.js**: ≥20 LTS
- **Docker**: Multi-stage build (production image)

## Project Structure

```
/
├── up                      # Orchestration: prereqs → backend → TF → build → deploy → migrate → test
├── down                    # Teardown: `terraform destroy`, optionally purges state backend
├── test                    # Wrapper for acceptance suite (runs Playwright)
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
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── globals.css
│   ├── src/lib/
│   │   ├── db.ts           # PostgreSQL connection pool (reads RDS secret from Secrets Manager)
│   │   ├── cognito.ts      # AWS SDK v3 CognitoIdentityProvider client wrapper
│   │   └── session.ts      # Session token parsing/validation (JWT from Cognito)
│   ├── src/instrumentation.ts  # Next.js instrumentation hook (DB init, pre-warm)
│   ├── migrations/
│   │   └── 001_init.sql    # Creates "hello_table" with one row
│   ├── scripts/migrate.js  # Node.js script: runs SQL files against RDS (invoked by ECS one-off task)
│   ├── Dockerfile          # Multi-stage: build → prune → runtime (Node.js 20 Alpine)
│   ├── package.json        # Dependencies: next, react, pg, @aws-sdk/*, etc.
│   └── next.config.ts      # Next.js config (standalone output for Docker)
└── acceptance/
    ├── specs/v1-acceptance.spec.ts  # 5-test suite: homepage → API → signup → signin → profile
    ├── playwright.config.ts
    ├── package.json
    └── screenshots/         # Test artefacts
```

## Entry Points & How It Starts

1. **`./up` orchestration script** (bash):
   - Checks prerequisites (`scripts/check-prereqs.sh`)
   - Bootstraps S3 + DynamoDB Terraform state backend (idempotent)
   - Applies Terraform phase 1 (creates ECR repository)
   - Builds Docker image: `docker build -t <ecr-url>:latest app/`
   - Pushes to ECR
   - Applies full Terraform stack
   - Runs DB migrations via one-off ECS task (`aws ecs run-task` → `migrate.js`)
   - Waits for ECS service healthy (polls ALB target health)
   - Outputs CloudFront URL
   - Runs `./test` against live deployment

2. **Next.js app** (ECS Fargate task):
   - Container starts with `CMD ["node", "server.js"]` (Next.js standalone server)
   - `src/instrumentation.ts` runs before requests (initializes DB pool, reads secrets)
   - ALB health check: `GET /api/health` → 200 if DB query succeeds
   - CloudFront forwards requests with custom header; ALB rejects all other traffic

3. **DB migrations**: `scripts/migrate.js` reads all `migrations/*.sql` (sorted), executes sequentially. Run once per deployment.

## Data Models & Core Domain

- **`hello_table`** (PostgreSQL): Single table with `id` (serial PK), `hello_value` (text). Seeded with one row: `"hello from the database"`. Used to prove DB connectivity.
- **Cognito User Pool**: Stores user accounts. V1 auto-confirms users on signup (no email verification). JWT access tokens used for session validation.
- **Session**: Stateless JWT. `lib/session.ts` parses Cognito tokens from cookies/headers, extracts `sub` (user ID) and `email`.
- **Secrets Manager**:
  - `/intentional/dev/rds` (RDS-managed): `username`, `password`, `host`, `port`, `dbname`
  - `/intentional/dev/external-services` (placeholder for V2): API keys for Sentry, PostHog, etc.

## Key Conventions & Constraints

- **Network segregation**: App runs in private subnets; no direct internet access. VPC endpoints (`ecr.dkr`, `logs`, `secretsmanager`) allow AWS API calls without NAT traversal.
- **CloudFront ↔ ALB authentication**: ALB security group + custom header check (`X-CloudFront-Secret`) ensures ALB only accepts CloudFront traffic. CloudFront uses default `*.cloudfront.net` TLS cert (V1).
- **Environment variables** (runtime, injected into ECS task):
  - `DATABASE_SECRET_ARN`: ARN of RDS secret in Secrets Manager
  - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`
  - `AWS_REGION`, `NODE_ENV=production`
- **DB connection pooling**: `lib/db.ts` uses `pg.Pool` with max 20 connections. Connection string constructed by fetching Secrets Manager secret on app startup.
- **Auto-confirm workaround (V1)**: `api/auth/signup` calls `AdminConfirmSignUp` after `SignUp` to bypass email verification (SES not configured).
- **Idempotency**: Re-running `./up` converges; does not duplicate resources. `terraform apply` is safe to repeat.
- **Force-delete flags**: All destroyable resources (`skip_final_snapshot=true` on RDS, `force_delete=true` on ECR/S3) ensure `./down` completes cleanly.

## Known TODOs / Areas Flagged for Improvement

- **V2 roadmap** (after V1 acceptance):
  - SES email verification (replace auto-confirm)
  - OpenTelemetry → Sentry/Grafana/Datadog
  - PostHog analytics
  - CI/CD pipeline (GitHub Actions, OPA policy gates, image scanning)
  - WAF custom rules (rate limiting, geo-blocking)
  - Automated restore verification (DR test)
  - DSAR/erasure tooling (GDPR/CCPA)
  - Multi-region DR (if mandated)
- **Custom CloudFront domain**: V1 uses default `*.cloudfront.net`; V2 should add Route 53 + ACM certificate.
- **Secrets rotation**: RDS secret auto-rotates (AWS-managed). App secrets in `/intentional/dev/external-services` need manual rotation strategy.
- **Terraform state locking**: DynamoDB table created by `./up` bootstrap; `backend.tf` must be manually copied from `backend.tf.example` (not automated).
- **Migration idempotency**: `migrate.js` re-runs all SQL files on every deploy; should track applied migrations (e.g., `migrations_log` table).
- **Acceptance test retries**: Playwright config has `retries: 2`; may mask flaky infra (ECS cold starts).
- **Hardcoded account ID**: `992382611473` in README; should be parameterized for multi-account use.

## Non-Obvious Developer Notes

- **Session validation**: `lib/session.ts` does **not** verify JWT signature (trusts Cognito tokens implicitly). Production should validate with Cognito JWKS.
- **ALB listens on HTTP:80 only**: TLS termination happens at CloudFront. ALB→Fargate traffic is unencrypted within VPC (acceptable for most compliance regimes; inter-AZ traffic stays on AWS backbone).
- **Playwright tests expect live AWS**: Tests call real Cognito `InitiateAuth`, real RDS via ALB. Cannot mock; requires fully deployed stack.
- **S3 Object Lock (COMPLIANCE mode)**: Audit log bucket cannot be purged until retention expires. `./down --purge-state` may fail if objects exist; manual intervention required.
- **Config rules**: AWS Config continuously evaluates compliance (e.g., S3 bucket encryption, RDS encryption). Violations logged but not enforced (no auto-remediation in V1).

## AutoCTO Directory

The `.autocto/` directory is written and maintained by the AutoCTO harness:

- `run-config.json` — how to install and start this app (commit-keyed)
- `init.sh` — startup script run before every generator task
- `feature_list.json` — the current run's task list (agent-facing source of truth)
- `progress.md` — cumulative history of AutoCTO runs on this repo

All of it is committed to the repo. Do not edit `feature_list.json` by hand — the harness owns it.
