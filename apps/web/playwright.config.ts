import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';
const repoRoot = path.join(__dirname, '..', '..');
const authDir = path.join(__dirname, 'e2e', '.auth');

const ciApiEnv = {
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/lms_ci',
  JWT_SECRET: process.env.JWT_SECRET ?? 'ci-test-secret',
  SEED_SUPER_ADMIN_EMAIL:
    process.env.SEED_SUPER_ADMIN_EMAIL ?? 'ci@example.com',
  SEED_SUPER_ADMIN_PASSWORD:
    process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'CiPassword123!',
  PORT: '4000',
};

/** Same seed/JWT/Mongo contract as local dev (see repo root `.env.example`). */
const localApiEnv = {
  ...process.env,
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/lms',
  JWT_SECRET: process.env.JWT_SECRET ?? 'change-me-in-production-use-long-random-string',
  SEED_SUPER_ADMIN_EMAIL:
    process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@example.com',
  SEED_SUPER_ADMIN_PASSWORD:
    process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMe123!',
  PORT: '4000',
};

const ciWebServers = [
  {
    command: 'pnpm run start:prod',
    cwd: path.join(repoRoot, 'apps', 'api'),
    port: 4000,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { ...process.env, ...ciApiEnv },
  },
  {
    command: 'pnpm run start',
    cwd: path.join(repoRoot, 'apps', 'web'),
    port: 3000,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_GRAPHQL_URL: 'http://127.0.0.1:4000/graphql',
    },
  },
];

/**
 * Local E2E must start the API too: `auth.setup.ts` seeds users via GraphQL before
 * browser tests. If you already run the API on :4000 (`pnpm run dev:api`), it is reused.
 */
const localWebServers = [
  {
    command: 'pnpm run start',
    cwd: path.join(repoRoot, 'apps', 'api'),
    port: 4000,
    reuseExistingServer: true,
    timeout: 120_000,
    env: localApiEnv,
  },
  {
    command: 'pnpm run dev',
    cwd: path.join(repoRoot, 'apps', 'web'),
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_GRAPHQL_URL: 'http://127.0.0.1:4000/graphql',
    },
  },
];

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium-public',
      testMatch: /smoke\.spec\.ts/,
    },
    {
      name: 'chromium-super-admin',
      testMatch: /roles\.super-admin\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: path.join(authDir, 'super-admin.json'),
      },
    },
    {
      name: 'chromium-admin',
      testMatch: /roles\.admin\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: path.join(authDir, 'admin.json'),
      },
    },
    {
      name: 'chromium-user',
      testMatch: /roles\.user\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: path.join(authDir, 'user.json'),
      },
    },
  ],
  webServer: process.env.CI ? ciWebServers : localWebServers,
});
