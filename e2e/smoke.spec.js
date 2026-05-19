import { test, expect } from '@playwright/test';

test('bootstrap shell renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /bootstrap shell/i })).toBeVisible();
});
