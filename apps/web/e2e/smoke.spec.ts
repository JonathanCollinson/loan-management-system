import { test, expect } from '@playwright/test';

test('login page shows sign in', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
});
