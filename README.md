# Intentional Enterprise Stack

Regulated-enterprise-grade Next.js web application on AWS. Full network segregation, HA, complete IaC. Stands up with `./up`, tears down completely with `./down`.

## Architecture

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

## AWS Setup

Configure an AWS CLI profile called `intentional` with credentials for account `992382611473`:

```bash
aws configure --profile intentional
```

The IAM user/role needs permissions to create all resources in the stack (VPC, ECS, RDS, Cognito, CloudFront, WAF, KMS, Secrets Manager, S3, DynamoDB, ECR, CloudWatch, Config, IAM roles).

## Quick Start

```bash
git clone git@github-intentional:HowardIntentional/enterprise-stack.git
cd enterprise-stack
./up
```

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

## Repository Structure

```
enterprise-stack/
├── up                        One-command stand-up
├── down                      One-command teardown
├── test                      Run acceptance suite
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

## V2 Roadmap

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
