# Loan Management System (LMS)

Monorepo for a loan operations app: **NestJS + GraphQL + MongoDB** API and **Next.js** web UI. Field users manage borrowers and loans; admins fund wallets, view reports, and configure system settings.

## Repository layout

| Path | Package | Description |
|------|---------|-------------|
| [`apps/api`](apps/api) | `@lms/api` | GraphQL API (NestJS), auth, RBAC |
| [`apps/web`](apps/web) | `@lms/web` | Next.js App Router UI |

Workspace is defined in [`pnpm-workspace.yaml`](pnpm-workspace.yaml). Install and run scripts from the **repository root**.

## Prerequisites

- **Node.js** 20+
- **pnpm** 9 ([install](https://pnpm.io/installation); [Corepack](https://nodejs.org/api/corepack.html): `corepack enable`)
- **MongoDB** (local install, or Docker via the dev script below)
- Optional: **Docker** for `docker compose` (API image + Mongo)

Multi-document transactions (monthly budget, loans, repayments) require MongoDB to support transactions: use a **replica set** (MongoDB Atlas, or a single-node replica set). The [`docker-compose.yml`](docker-compose.yml) `mongo` service runs with `--replSet rs0` and a one-shot `mongo-init` that calls `rs.initiate`. For a **standalone** `mongod` without a replica set, the API falls back to non-transactional writes (acceptable for local dev; use a replica set in production).

If you switch an existing data volume from standalone to replica set, you may need to remove the Docker volume or re-init the repl set; see MongoDB docs for `rs.initiate`.

For a manual local `mongod`, start with `--replSet rs0`, then in `mongosh` run `rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "localhost:27017" }] })` (adjust host/port).

## Setup

1. Clone the repo and install dependencies:

   ```bash
   pnpm install
   ```

2. Environment variables — copy the example file to the repo root and adjust:

   ```bash
   cp .env.example .env
   ```

   See [`.env.example`](.env.example) for `MONGODB_URI`, `JWT_SECRET`, web `NEXT_PUBLIC_GRAPHQL_URL`, and optional SuperAdmin seeding.

   **MongoDB URI:** `pnpm run dev:api` starts Mongo in Docker on host port **27018** (not 27017). Use `MONGODB_URI=mongodb://127.0.0.1:27018/lms?directConnection=true` in `.env` (as in `.env.example`). If `MONGODB_URI` still points at `localhost:27017` while only Docker Mongo is running, the API will log **Server selection timed out** until you fix the port or start a local `mongod` on 27017.

3. Start MongoDB and the API in development (stops any compose `api` container to free port 4000, starts Mongo, then runs Nest in watch mode):

   ```bash
   pnpm run dev:api
   ```

   Or run the full stack in Docker (API exposed on host **4001**):

   ```bash
   pnpm run dev:api:docker
   ```

4. Start the web app (default [http://localhost:3000](http://localhost:3000)):

   ```bash
   pnpm run dev:web
   ```

   Point `NEXT_PUBLIC_GRAPHQL_URL` in `.env` at your API (e.g. `http://localhost:4000/graphql`).

## Root scripts

| Script | Purpose |
|--------|---------|
| `pnpm run dev:api` | Mongo (compose) + Nest API watch on port 4000 |
| `pnpm run dev:api:docker` | `docker compose up -d` (API + Mongo) |
| `pnpm run dev:web` | Next.js dev server |
| `pnpm run build` | Build API then web |
| `pnpm run test` | API unit tests (Jest) |
| `pnpm run test:web` | Web unit tests (Jest + Testing Library) |
| `pnpm run test:integration` | API GraphQL integration tests (MongoDB Memory Server or `INTEGRATION_MONGODB_URI`) |
| `pnpm run test:e2e` | Web Playwright tests |

Package-specific commands use filters, e.g. `pnpm --filter @lms/api run start:dev`, `pnpm --filter @lms/web run build`.

### Test environment variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `MONGODB_URI` | API, CI | MongoDB connection string |
| `INTEGRATION_MONGODB_URI` | `pnpm run test:integration` | Optional: real Mongo URI instead of embedded Mongo Memory Server |
| `NEXT_PUBLIC_GRAPHQL_URL` | Web, Playwright | GraphQL HTTP endpoint (e.g. `http://localhost:4000/graphql`) |
| `PLAYWRIGHT_BASE_URL` | Playwright | Web app base URL (default `http://127.0.0.1:3000`) |
| `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` | API seed, E2E | First Super Admin when the users collection is empty; E2E defaults fall back to these |
| `E2E_SUPER_ADMIN_*`, `E2E_ADMIN_*`, `E2E_USER_*` | Playwright `e2e/auth.setup.ts` | Optional overrides for login and seeded admin/field users |

Playwright E2E with `CI=true` starts the API and web from built artifacts; ensure MongoDB is available and matches `MONGODB_URI`. For local E2E, start Mongo and the API (`pnpm run dev:api`), then run `pnpm run test:e2e` — Playwright reuses an existing dev server on port 3000 when present.

## Features (high level)

- **Roles**: `USER` (field), `ADMIN`, `SUPER_ADMIN`
- **Borrowers & loans** with flat interest, repayments, wallet debits for principal
- **Funding**: admins record transfers to field users; optional **period** (YYYY-MM); utilization report per month
- **Borrower loan summary** table with totals and optional **month** filter (`/borrowers/summary`)
- **System config**: Super Admin default interest rate (`/admin/settings`)
- **Reports** and dashboard metrics

## Git commits

[Husky](https://typicode.github.io/husky/) runs [commitlint](https://commitlint.js.org/) on commit messages. Use [Conventional Commits](https://www.conventionalcommits.org/), for example:

- `feat: add borrower export`
- `fix(api): correct paidAt on sync`

Configuration: [`commitlint.config.cjs`](commitlint.config.cjs), hook: [`.husky/commit-msg`](.husky/commit-msg).

## CI

GitHub Actions workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — install, API unit tests, API integration tests (Mongo service), web unit tests, build API and web, Playwright E2E against the built stack.

## API & web details

- **API**: see [`apps/api/README.md`](apps/api/README.md)
- **Web**: see [`apps/web/README.md`](apps/web/README.md)

## Docker

- [`Dockerfile`](Dockerfile) builds the API image (pnpm workspace).
- [`docker-compose.yml`](docker-compose.yml) — Mongo and API; adjust `MONGODB_URI` for your environment.
