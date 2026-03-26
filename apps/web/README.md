# LMS Web (`@lms/web`)

[Next.js](https://nextjs.org) (App Router) front end for the Loan Management System. It talks to the GraphQL API via [Apollo Client](https://www.apollographql.com/docs/react/).

## Install and run (from monorepo root)

```bash
pnpm install
cp .env.example .env   # set NEXT_PUBLIC_GRAPHQL_URL to your API
pnpm run dev:web
```

Open [http://localhost:3000](http://localhost:3000). The API must be running and reachable at the URL in `NEXT_PUBLIC_GRAPHQL_URL` (e.g. `http://localhost:4000/graphql`).

Equivalent:

```bash
pnpm --filter @lms/web run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm --filter @lms/web run dev` | Dev server (Turbopack) |
| `pnpm --filter @lms/web run build` | Production build |
| `pnpm --filter @lms/web run start` | Serve production build |
| `pnpm --filter @lms/web run lint` | ESLint |
| `pnpm --filter @lms/web run test:e2e` | Playwright tests |

## Environment

See [`.env.example`](../../.env.example). Required for the browser:

- `NEXT_PUBLIC_GRAPHQL_URL` — GraphQL HTTP endpoint (must be public to the browser)

## App routes (examples)

- `/login` — authentication
- `/dashboard` — metrics
- `/borrowers`, `/borrowers/summary` — list and loan summary table
- `/loans` — loans
- `/reports` — reporting
- `/admin/funding`, `/admin/users`, `/admin/settings` (roles permitting)

## Further reading

- [Next.js documentation](https://nextjs.org/docs)
- Root [README](../../README.md) for monorepo setup and API startup
