import { test, expect } from '@playwright/test';
import { SELECTORS } from '../../utils/selectors';
import { TEST_DATA } from '../../utils/test-data';

test.describe('Login Flow Verification', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the login route before each test
    await page.goto('/login');
  });

  test('should display errors for invalid credentials', async ({ page }) => {
    // Fill credentials
    await page.fill(SELECTORS.login.emailInput, TEST_DATA.users.invalid.email);
    await page.fill(SELECTORS.login.passwordInput, TEST_DATA.users.invalid.password);
    
    // Submit
    await page.click(SELECTORS.login.submitButton);

    // Assert error alert displays
    const errorAlert = page.locator(SELECTORS.login.errorAlert);
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/(failed|invalid|credentials)/i);
  });

  test('should log in successfully as student and redirect to dashboard', async ({ page }) => {
    // Fill student credentials (USN)
    await page.fill(SELECTORS.login.emailInput, TEST_DATA.users.student.email);
    await page.fill(SELECTORS.login.passwordInput, TEST_DATA.users.student.password);
    
    // Submit
    await page.click(SELECTORS.login.submitButton);

    // Verify redirect to student dashboard
    await page.waitForURL('**/dashboard/student');
    await expect(page).toHaveURL(/.*dashboard\/student/);

    // Verify avatar dropdown shows student credentials
    const avatar = page.locator(SELECTORS.login.navbarAvatar);
    await expect(avatar).toBeVisible();
    await avatar.click();
    
    // Check dropdown content contains student's initials/role
    await expect(page.locator('text=student').first()).toBeVisible();
  });

  test('should log in successfully as admin and show admin controls', async ({ page }) => {
    // Fill admin credentials
    await page.fill(SELECTORS.login.emailInput, TEST_DATA.users.admin.email);
    await page.fill(SELECTORS.login.passwordInput, TEST_DATA.users.admin.password);
    
    // Submit
    await page.click(SELECTORS.login.submitButton);

    // Verify redirect to admin dashboard
    await page.waitForURL('**/dashboard/admin');
    await expect(page).toHaveURL(/.*dashboard\/admin/);

    // Verify admin command grid options exist
    await expect(page.locator('text=AI Analytics')).toBeVisible();
    await expect(page.locator('text=Users')).toBeVisible();
  });
});
