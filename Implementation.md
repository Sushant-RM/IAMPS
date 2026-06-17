# Implementation Details

## 1. Backend Implementation
- **Framework:** Express.js instance located in `backend/index.js`.
- **Middleware:** Custom `authMiddleware` verifies JWT tokens attached to headers.
- **Controllers:** Business logic decoupled into `/controllers`. For example, `achievementController.js` handles CRUD operations and status mutations.
- **Seeding:** A robust `seed.js` script clears the DB and populates highly realistic demo data across Departments, Users, Events, Papers, and Achievements.

## 2. Frontend Implementation
- **Routing:** Hybrid Next.js architecture utilizing both App Router (`/app/dashboard`) and Pages Router (`/pages/portfolio`).
- **Data Fetching:** Handled via Axios client.
- **Styling:** Tailwind CSS utility classes are heavily utilized for rapid styling and responsiveness.

## 3. File Processing Integration
- **DOCX Generation:** Utilizes the `docx` package to programmatically structure Word documents.
- **PDF Generation:** Puppeteer launches a headless browser, renders an EJS/HTML template populated with student data, and prints the result to a PDF buffer.

## 4. External Dataset Interfacing
The portfolio generator interfaces with `datasets/placementdata.csv` to fetch realistic placement and soft-skill metrics associated with the user based on hashed identifiers.
