# Design Document

## 1. UI/UX Principles
- **Minimalism & Clarity:** Emphasizes content over clutter. Forms are split into logical steps or clean single-page structures.
- **Responsiveness:** Tailwind CSS is utilized to ensure all charts, tables, and forms render cleanly on mobile, tablet, and desktop viewports.
- **Feedback:** Visual cues for system status (e.g., Green badges for Approved, Yellow for Pending, Red for Rejected).

## 2. Component Structure (Frontend)
- **Pages Directory (`/pages`):** Handles legacy/static routes like `/login`, `/portfolio`, `/events`.
- **App Directory (`/app`):** Handles nested dashboard layouts and modern routing components for `/dashboard` and `/achievements`.
- **Shared Components:** Reusable UI elements (Buttons, Inputs, Modals, Navbar, Sidebar).
- **Contexts:** React Context API manages global state such as the active User session and theme preferences.

## 3. Data Visualization
Utilizes **Recharts** for the admin dashboard:
- **Bar Charts:** To display the number of achievements grouped by Category.
- **Pie Charts:** To show the distribution across different Departments.

## 4. Document Design (Exports)
Portfolios are rendered using pre-built HTML templates (`backend/templates/professional.html`, etc.) ensuring consistent typographic hierarchy, clean margins, and professional layouts when converted to PDF/DOCX.
