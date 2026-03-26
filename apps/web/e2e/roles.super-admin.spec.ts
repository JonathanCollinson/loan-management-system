import { test, expect } from '@playwright/test';

test.describe('Super Admin flows', () => {
  test('Capital page loads', async ({ page }) => {
    await page.goto('/admin/capital');
    await expect(
      page.getByRole('heading', { name: /Monthly principal \(CEO capital\)/ }),
    ).toBeVisible();
  });

  test('System settings page loads', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(
      page.getByRole('heading', { name: 'System settings' }),
    ).toBeVisible();
  });
});
