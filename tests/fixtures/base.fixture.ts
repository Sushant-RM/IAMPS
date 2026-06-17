import { test as baseTest, Page } from '@playwright/test';
import { TEST_DATA } from '../../utils/test-data';
import { SELECTORS } from '../../utils/selectors';

// Declare custom fixtures
type CustomFixtures = {
  authenticatedStudentPage: Page;
  authenticatedAdminPage: Page;
};

// Extend the base test configuration
export const test = baseTest.extend<CustomFixtures>({
  // Auto-authenticated page for student
  authenticatedStudentPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill(SELECTORS.login.emailInput, TEST_DATA.users.student.email);
    await page.fill(SELECTORS.login.passwordInput, TEST_DATA.users.student.password);
    await page.click(SELECTORS.login.submitButton);
    
    // Wait for the URL to change to the dashboard
    await page.waitForURL('**/dashboard/student');
    
    // Pass the logged-in page instance to the test
    await use(page);
  },

  // Auto-authenticated page for admin
  authenticatedAdminPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill(SELECTORS.login.emailInput, TEST_DATA.users.admin.email);
    await page.fill(SELECTORS.login.passwordInput, TEST_DATA.users.admin.password);
    await page.click(SELECTORS.login.submitButton);
    
    // Wait for the URL to change to the dashboard
    await page.waitForURL('**/dashboard/admin');
    
    // Pass the logged-in page instance to the test
    await use(page);
  }
});

export { expect } from '@playwright/test';
