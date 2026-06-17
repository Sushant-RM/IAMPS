/**
 * Test data catalog containing seed credentials and validation sets.
 */
export const TEST_DATA = {
  users: {
    admin: {
      email: 'admin@college.edu',
      password: 'Admin@2025',
      fullName: 'System Administrator',
      initials: 'SA',
    },
    faculty: {
      email: 'sunita.sharma@college.edu',
      password: 'User@123',
      fullName: 'Prof. Sunita Sharma',
    },
    student: {
      email: '1MS22CSE001', // Using USN directly for login
      password: 'User@123',
      fullName: 'Arjun Sharma',
      usn: '1MS22CSE001',
    },
    invalid: {
      email: 'unknown@college.edu',
      password: 'WrongPassword123',
    }
  },
  paper: {
    title: 'Playwright E2E Integration Paper',
    abstract: 'Abstract detailing Playwright E2E testing benefits.',
    authors: '[\"Arjun Sharma\"]',
    department: 'Computer Science',
    year: 2025,
  }
};
