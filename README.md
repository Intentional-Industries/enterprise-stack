# Intentional Enterprise Stack

**A batteries-included, enterprise-ready AWS foundation for any web app.**

Most teams that need to ship a regulated-enterprise-grade web app end up
rebuilding the same thing from scratch: a segregated VPC, a WAF-fronted CDN,
an encrypted multi-AZ database, a managed identity provider, and all the
IAM/KMS/logging plumbing an auditor is going to ask about — before they've
written a single feature. This repo is that foundation, already built,
wired together, and provable: `./up` stands up the entire stack on AWS from
nothing, and `./down` tears it back down to nothing, with no orphaned
resources either way.

It ships with a minimal Next.js app (a DB-backed page and a Cognito
sign-up/sign-in flow) as a working reference — swap in your own app and the
infrastructure underneath it doesn't need to change.

## Why this exists

Security and compliance requirements for enterprise web apps are largely the
same from company to company — network segregation, encryption at rest and
in transit, centralised audit logging, least-privilege IAM, managed auth —
but they're expensive to get right and easy to get subtly wrong. Encoding
them once, as infrastructure-as-code with an acceptance suite that proves
they actually work, means every app built on top starts from "compliant by
default" instead of "compliant eventually, maybe."

## What's included

| Concern | How it's handled |
|---|---|
| **Network isolation** | 3-tier VPC (public / private / data); app runs in private subnets with no public IP |
| **Edge & DDoS/WAF** | CloudFront + AWS WAF (Common, KnownBadInputs, SQLi managed rule sets) |
| **Compute** | ECS Fargate, autoscaling-ready, pulls from a scanned ECR repo |
| **Database** | RDS PostgreSQL, Multi-AZ, encrypted with a customer-managed KMS key |
| **Identity** | AWS Cognito user pool + client (JWT-based sessions) |
| **Secrets** | AWS Secrets Manager, RDS credentials auto-rotated |
| **Observability** | CloudWatch Logs, AWS Config continuous compliance evaluation |
| **Audit trail** | S3 bucket with Object Lock in COMPLIANCE mode (immutable) |
| **IaC** | Modular Terraform, one command up, one command down, idempotent |
| **Local dev** | `./dev` — the same app, running against Docker Postgres + a local Cognito emulator, no AWS required |

## Two ways to run it

**Iterating on the app itself?** You don't need AWS for that. `./dev` gives
you the Next.js app with hot-reload, a local Postgres, and a local Cognito
emulator (so sign-up/sign-in work too) — everything running in Docker on
your machine. See **[LOCAL_DEV.md](LOCAL_DEV.md)**.

**Need the real thing — CloudFront, WAF, real Cognito, the full compliance
posture?** That's `./up`, below. It provisions actual AWS resources and
costs actual money while it's running; `./down` cleans it up completely.

Use local dev for day-to-day feature work and debugging; use the full stack
to validate anything that depends on the infrastructure itself (auth against
real Cognito, edge/WAF behavior, the acceptance suite).

## Architecture (full stack)

```
Internet
│
[ Route 53 ]         DNS health-check failover
│
[ CloudFront ]       CDN + TLS termination (default *.cloudfront.net cert)
│
[ AWS WAF ]          Managed rules: Common, KnownBadInputs, SQLi
│
[ ALB ]              Public L7 load balancer (HTTP:80, public subnets)
│                    Custom header check — only accepts requests from CloudFront
│
┌──────────────────────────────────────────────┐
│  PRIVATE SUBNETS                             │
│  [ ECS Fargate ]   Next.js SSR + API         │
│  No public IP — VPC endpoints for AWS APIs   │
└────────────┬──────────────┬──────────────────┘
             │              │
    ┌─────────┴──────┐  ┌───┴──────────────┐
    │ DATA SUBNETS   │  │ Cognito (managed) │
    │ RDS PostgreSQL │  │ User Pool + Client│
    │ Multi-AZ       │  └──────────────────┘
    └────────────────┘

Cross-cutting:
  KMS CMK            Customer-managed encryption keys
  Secrets Manager    DB credentials (RDS-managed rotation) + app secrets
  CloudWatch Logs    Centralised structured logging
  AWS Config         Continuous compliance evaluation
  ECR                Container registry (enhanced scanning)
  S3 Object Lock     Immutable audit log bucket (COMPLIANCE mode)
```

## Prerequisites

| Tool        | Version  | Install                                      |
|-------------|----------|----------------------------------------------|
| AWS CLI     | ≥ 2.x    | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| Terraform   | ≥ 1.7    | https://developer.hashicorp.com/terraform/install |
| Docker      | ≥ 24     | https://docs.docker.com/get-docker/          |
| Node.js     | ≥ 20 LTS | https://nodejs.org/                          |
| jq          | any      | `brew install jq` / `apt install jq`         |

Run `./scripts/check-prereqs.sh` to verify all tools are present.

(Local dev via `./dev` only needs Docker and Node — see [LOCAL_DEV.md](LOCAL_DEV.md).)

## AWS Setup

Configure an AWS CLI profile called `intentional` with credentials for account `992382611473`:

```bash
aws configure --profile intentional
```

The IAM user/role needs permissions to create all resources in the stack (VPC, ECS, RDS, Cognito, CloudFront, WAF, KMS, Secrets Manager, S3, DynamoDB, ECR, CloudWatch, Config, IAM roles).

## Quick Start

```bash
git clone https://github.com/Intentional-Industries/enterprise-stack.git
cd enterprise-stack
./up
```

Just want to run the app locally (Next.js + Postgres + Cognito emulator, no AWS)? See
[LOCAL_DEV.md](LOCAL_DEV.md) — `./dev` gets you there in one command.

`./up` performs in order:
1. Prerequisite checks
2. Bootstrap S3 + DynamoDB state backend (idempotent)
3. Apply Terraform phase 1 (creates ECR)
4. Build and push Docker image to ECR
5. Apply Terraform (full stack)
6. Run DB migrations via one-off ECS task
7. Wait for ECS service to stabilise
8. Print the live app URL
9. Run `./test` against the live deployment

Re-running `./up` converges — it does not duplicate resources.

## Environment Variables

All have sensible defaults. Override before running `./up`:

| Variable       | Default        | Description                           |
|----------------|----------------|---------------------------------------|
| `PROJECT`      | `intentional`  | Resource name prefix                  |
| `ENVIRONMENT`  | `dev`          | Environment suffix                    |
| `AWS_REGION`   | `us-east-1`    | Target AWS region                     |
| `AWS_PROFILE`  | `intentional`  | AWS CLI profile to use                |

Example:
```bash
AWS_PROFILE=intentional ENVIRONMENT=dev ./up
```

## Running Tests Independently

```bash
APP_URL=https://xxxxx.cloudfront.net \
  AWS_PROFILE=intentional \
  AWS_REGION=us-east-1 \
  COGNITO_USER_POOL_ID=us-east-1_XXXXX \
  DB_SECRET_ARN=arn:aws:secretsmanager:... \
  ./test
```

## V1 Acceptance Criteria

All 5 steps must pass unaided against live AWS services (real CloudFront, RDS, Cognito):

| # | Test | What it proves |
|---|------|---------------|
| 1 | GET `https://<cloudfront-domain>/` → 200, page contains `hello world` | DB read path is live |
| 2 | `/api/hello` returns the DB row value (not a hardcoded string) | Value is DB-sourced |
| 3 | Sign up at `/auth/signup` → auto-confirmed server-side (V1) | Cognito account creation works |
| 4 | Sign in at `/auth/signin` → redirect to `/profile` | Authentication works |
| 5 | `/profile` displays the email or Cognito `sub` for the session user | Auth claims are surfaced |

Test artefacts (screenshots, HTML report) are saved to `acceptance/playwright-report/`.

## Teardown

```bash
./down                 # Destroys all AWS resources
./down --purge-state   # Also removes the S3 state bucket and DynamoDB lock table
```

`./down` leaves no orphaned resources or ongoing cost. Specifically:
- `skip_final_snapshot = true` on RDS
- `force_delete = true` on ECR
- `force_destroy = true` on S3 buckets
- `deletion_protection = false` on RDS

## Adapting this for your own app

The infrastructure doesn't know or care what's in `app/` — it builds
whatever `app/Dockerfile` produces and points ECS at it. To bring your own
app:

1. Replace `app/` with your own service (keep a `Dockerfile` that produces a
   container listening on the port ECS expects, and a `/api/health`-style
   endpoint for the ALB health check).
2. Point `app/scripts/migrate.js` (or your own migration runner) at your own
   `migrations/`.
3. Adjust `terraform/variables.tf` / `environments/dev/terraform.tfvars` for
   naming, sizing, and region.
4. Everything else — VPC, WAF, Cognito, KMS, Secrets Manager, CloudWatch,
   Config, the audit bucket — carries over unchanged.

## Repository Structure

```
enterprise-stack/
├── up                        One-command stand-up
├── down                      One-command teardown
├── dev                       One-command local dev (app + DB + Cognito emulator, no AWS)
├── test                      Run acceptance suite
├── docker-compose.yml        Local Postgres + cognito-local for ./dev
├── LOCAL_DEV.md              Local development guide
├── terraform/
│   ├── main.tf               Root module — calls all child modules
│   ├── variables.tf          Input variables
│   ├── outputs.tf            Stack outputs (CloudFront URL, ECR URL, etc.)
│   ├── versions.tf           Provider constraints
│   ├── environments/dev/     Dev-environment tfvars
│   └── modules/
│       ├── network/          VPC, subnets, NAT, VPC endpoints
│       ├── security/         KMS CMK, security groups
│       ├── data/             RDS PostgreSQL, Secrets Manager
│       ├── identity/         Cognito User Pool + Client
│       ├── compute/          ECR, ECS Fargate, ALB, IAM roles
│       ├── edge/             CloudFront, WAF WebACL
│       └── observability/    CloudWatch, AWS Config, audit S3 bucket
├── app/
│   ├── src/app/              Next.js 14 App Router pages + API routes
│   ├── src/lib/              DB pool, Cognito client, session helpers
│   ├── migrations/           SQL migration files
│   ├── scripts/migrate.js    Migration runner (run as one-off ECS task)
│   └── Dockerfile            Multi-stage production build
├── acceptance/
│   ├── specs/v1-acceptance.spec.ts   Playwright V1 acceptance tests
│   ├── playwright.config.ts
│   └── package.json
├── scripts/
│   └── check-prereqs.sh      Verify tool versions before ./up
└── README.md
```

## Roadmap

After V1 is accepted, populate `intentional/external-services` in Secrets Manager (created empty by `./up`), then V2 adds:

- **OpenTelemetry export** → Sentry / Grafana / Datadog
- **Sentry** — RUM, performance monitoring, error tracking
- **PostHog** — product analytics (self-hostable)
- **SES** — production email verification (replaces V1 auto-confirm)
- **CI/CD pipeline** — GitHub Actions with OPA policy-as-code and image scanning gate
- **Full WAF custom rules** — rate limiting, geo-blocking
- **Automated restore verification** (DAT-6)
- **DSAR / erasure tooling** (GOV-8)
- **Multi-region DR** (if mandated by GOV-4)
