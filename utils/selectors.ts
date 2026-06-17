/**
 * Centralized selector catalog for Page Object Model (POM) reference.
 * Using semantic role locators and standard CSS class patterns.
 */
export const SELECTORS = {
  login: {
    emailInput: '#email',
    passwordInput: '#password',
    submitButton: 'button[type="submit"]',
    errorAlert: '.bg-red-50 p, .bg-red-100', // Matches current alert styling
    navbarAvatar: '#user-menu-button',
    roleBadge: '[class*="bg-red-100"], [class*="bg-purple-100"], [class*="bg-blue-100"]',
  },
  navbar: {
    avatarButton: '#user-menu-button',
    logoutButton: '#logout-button',
    menuLinks: {
      library: 'text=Library',
      scholars: 'text=Scholars',
      insights: 'text=Insights',
      events: 'text=Events',
      achievements: 'text=Achievements',
      portfolio: 'text=Portfolio',
    },
    userDropdown: {
      dashboard: 'text=My Dashboard',
      submitPaper: 'text=Submit Paper',
      submitEvent: 'text=Submit Event Proof',
      myEvents: 'text=My Events',
      signOut: 'text=Sign Out',
    }
  },
  dashboard: {
    adminHeader: 'h1:has-text("Institutional Intelligence"), h1:has-text("Review Command")',
    studentHeader: 'h1:has-text("Research Hub")',
    statsCard: '.bg-white\\/40, .bg-slate-900\\/40, .shadow-xl',
  }
};
