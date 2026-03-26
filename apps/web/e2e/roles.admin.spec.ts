import { test, expect } from '@playwright/test';

test.describe('Admin flows', () => {
  test('Funding page loads', async ({ page }) => {
    await page.goto('/admin/funding');
    await expect(page.getByRole('heading', { name: 'Funding' })).toBeVisible();
  });

  test('Field users page loads', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'Field users' })).toBeVisible();
  });
});
