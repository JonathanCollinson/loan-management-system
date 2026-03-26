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
