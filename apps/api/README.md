# LMS API (`@lms/api`)

NestJS application exposing a **GraphQL** API over HTTP, backed by **MongoDB**. It handles authentication (JWT), role-based access, borrowers, loans, repayments, funding transfers, reports, and system configuration.

Built with [NestJS](https://nestjs.com/). Entry: `src/main.ts`; GraphQL schema is emitted to `src/schema.gql` at build/dev.

## Install and run (from monorepo root)

```bash
pnpm install
cp .env.example .env   # repo root; see root README
pnpm run dev:api        # starts Mongo (compose) + API on PORT (default 4000)
```

Or run only this package:

```bash
pnpm --filter @lms/api run start:dev
```

Ensure `MONGODB_URI` in `.env` matches your MongoDB. The app loads `.env` from the repo root and from `apps/api` (see `app.module.ts` `envFilePath`).

If you use **`pnpm run dev:api`** from the monorepo root, Compose exposes Mongo on **127.0.0.1:27018**. Use e.g. `mongodb://127.0.0.1:27018/lms?directConnection=true`. A URI on **27017** while only Docker Mongo is running causes **MongooseServerSelectionError** (connection timeout).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm --filter @lms/api run start` | Start once (no watch) |
| `pnpm --filter @lms/api run start:dev` | Watch mode |
| `pnpm --filter @lms/api run start:prod` | Production (`node dist/main.js`) |
| `pnpm --filter @lms/api run build` | `nest build` |
| `pnpm --filter @lms/api run test` | Jest unit tests |
| `pnpm --filter @lms/api run test:integration` | GraphQL integration tests (`test/jest-integration.json`; optional `INTEGRATION_MONGODB_URI`) |
| `pnpm --filter @lms/api run test:e2e` | E2E (see `test/jest-e2e.json`) |

## MongoDB transactions

Operations that touch multiple documents in one logical step (monthly principal budget, loan creation, repayments) use MongoDB **transactions**. Those require a **replica set** (or sharded cluster). Atlas is always a replica set.

**Local Docker:** use the repo [`docker-compose.yml`](../../docker-compose.yml) `mongo` + `mongo-init` services so the server runs as a single-node replica set.

**Local binary:** run `mongod` with `--replSet rs0` and run `rs.initiate` once in `mongosh` (see root [README](../../README.md)).

If the server is a **standalone** instance (`mongod` without `--replSet`), the API detects transaction failures and retries without a transaction (no atomicity across writes — fine for solo dev; production should use a replica set).

## Environment variables

See [`.env.example`](../../.env.example) at the repo root. Common values:

- `MONGODB_URI` — Mongo connection string
- `PORT` — HTTP port (default 4000)
- `JWT_SECRET`, `JWT_EXPIRES_SEC`
- `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_PASSWORD` — seed first SuperAdmin if the users collection is empty

## Modules (overview)

- **Auth** — login, JWT strategy
- **Users** — roles, wallet balance
- **Borrowers** — CRUD, `borrowerLoanSummary` query (optional `month`)
- **Loans** — create/list; principal debited from field user wallet
- **Repayments** — record payments; loan status / `paidAt`
- **Funding** — admin transfers; `fundingUtilization(month)` for admins
- **Dashboard** / **Reports**
- **System config** — `defaultInterestRate` (Super Admin)

## Further reading

- [NestJS documentation](https://docs.nestjs.com)
- Root [README](../../README.md) for monorepo commands and Docker
