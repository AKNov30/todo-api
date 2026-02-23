# GitHub CI Workflow Design

## Overview

GitHub Actions CI pipeline that runs on every push to main. Verifies the NestJS project builds and passes lint checks.

## Workflow

**File:** `.github/workflows/ci.yml`
**Trigger:** push to main branch
**Runner:** ubuntu-latest
**Node:** 20 (LTS)

**Steps:**
1. Checkout code
2. Setup Node 20 with npm cache
3. `npm ci` (clean install from lock file)
4. `npx prisma generate` (generate Prisma client for build)
5. `npm run build` (TypeScript compilation)
6. `npm run lint` (ESLint check)

## Key Decisions

- Single job (simple, good for learning CI/CD)
- `npm ci` over `npm install` (faster, deterministic)
- `prisma generate` required before build (code imports @prisma/client)
- No PostgreSQL service needed (build+lint don't connect to DB)
- npm cache via actions/setup-node for faster subsequent runs
