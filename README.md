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
| `pnpm run test` | API unit tests |
| `pnpm run test:e2e` | Web Playwright tests |

Package-specific commands use filters, e.g. `pnpm --filter @lms/api run start:dev`, `pnpm --filter @lms/web run build`.

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

GitHub Actions workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — `pnpm install --frozen-lockfile`, build and test API, build web.

## API & web details

- **API**: see [`apps/api/README.md`](apps/api/README.md)
- **Web**: see [`apps/web/README.md`](apps/web/README.md)

## Docker

- [`Dockerfile`](Dockerfile) builds the API image (pnpm workspace).
- [`docker-compose.yml`](docker-compose.yml) — Mongo and API; adjust `MONGODB_URI` for your environment.
