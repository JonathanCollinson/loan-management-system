import { test, expect } from '@playwright/test';

test.describe('Field user flows', () => {
  test('Dashboard shows monthly loan KPIs', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Borrowers with loans')).toBeVisible();
    await expect(page.getByText('Total principal')).toBeVisible();
  });

  test('Borrowers list loads', async ({ page }) => {
    await page.goto('/borrowers');
    await expect(page.getByRole('heading', { name: 'Borrowers' })).toBeVisible();
  });

  test('logout returns to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
