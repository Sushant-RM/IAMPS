import { test, expect } from '@playwright/test';

test.describe('Homepage E2E Verification', () => {
  test('should load the homepage and verify branding components', async ({ page }) => {
    // Go to the base URL
    await page.goto('/');

    // Verify document title contains Research Ecosystem (configured in Next.js metadata)
    await expect(page).toHaveTitle(/Research Ecosystem/i);

    // Verify main hero heading loads
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText(/Student/i);
    await expect(mainHeading).toContainText(/Research Portal/i);

    // Verify exploration call-to-actions are present
    const exploreButton = page.locator('text=Explore Archives');
    await expect(exploreButton).toBeVisible();
    await expect(exploreButton).toHaveAttribute('href', '/browse-papers');
  });
});
