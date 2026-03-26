import { mkdirSync } from 'fs';
import { join } from 'path';
import { test as setup, expect } from '@playwright/test';
import { seedE2EUsers } from './helpers/graphql';

const authDir = join(process.cwd(), 'e2e', '.auth');

function creds() {
  // Defaults align with repo `.env.example` and `playwright.config` localApiEnv; CI sets SEED_* in the job env.
  const superAdminEmail =
    process.env.E2E_SUPER_ADMIN_EMAIL ??
    process.env.SEED_SUPER_ADMIN_EMAIL ??
    'admin@example.com';
  const superAdminPassword =
    process.env.E2E_SUPER_ADMIN_PASSWORD ??
    process.env.SEED_SUPER_ADMIN_PASSWORD ??
    'ChangeMe123!';
  const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@local.test';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'E2eTest123!';
  const userEmail = process.env.E2E_USER_EMAIL ?? 'e2e-user@local.test';
  const userPassword = process.env.E2E_USER_PASSWORD ?? 'E2eTest123!';
  return {
    superAdminEmail,
    superAdminPassword,
    adminEmail,
    adminPassword,
    userEmail,
    userPassword,
  };
}

setup.describe('auth', () => {
  setup.describe.configure({ mode: 'serial' });

  setup('seed admin and field user via GraphQL', async () => {
    mkdirSync(authDir, { recursive: true });
    const c = creds();
    await seedE2EUsers({
      superAdminEmail: c.superAdminEmail,
      superAdminPassword: c.superAdminPassword,
      adminEmail: c.adminEmail,
      adminPassword: c.adminPassword,
      adminName: 'E2E Admin',
      fieldUserEmail: c.userEmail,
      fieldUserPassword: c.userPassword,
      fieldUserName: 'E2E Field User',
    });
  });

  setup('storage state: Super Admin', async ({ page }) => {
    const c = creds();
    await page.goto('/login');
    await page.getByLabel('Email').fill(c.superAdminEmail);
    await page.getByLabel('Password').fill(c.superAdminPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.context().storageState({
      path: join(authDir, 'super-admin.json'),
    });
  });

  setup('storage state: Admin', async ({ page }) => {
    const c = creds();
    await page.goto('/login');
    await page.getByLabel('Email').fill(c.adminEmail);
    await page.getByLabel('Password').fill(c.adminPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.context().storageState({
      path: join(authDir, 'admin.json'),
    });
  });

  setup('storage state: User', async ({ page }) => {
    const c = creds();
    await page.goto('/login');
    await page.getByLabel('Email').fill(c.userEmail);
    await page.getByLabel('Password').fill(c.userPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.context().storageState({
      path: join(authDir, 'user.json'),
    });
  });
});
