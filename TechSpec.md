# Technical Specification

## 1. Technology Stack
- **Frontend:** Next.js 16 (App & Pages Router hybrid), React 19, TypeScript, Tailwind CSS.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB with Mongoose ODM.
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs.
- **File Processing & AI:** `docx` & `puppeteer`/`pdf-parse` for document generation, Axios for API communications.

## 2. System Architecture
A standard Client-Server architecture. The Next.js frontend acts as the client, communicating via RESTful APIs to the Node.js backend. 
- **Frontend Routing:** Uses Next.js dynamic routing. Pages mapped to specific user roles (e.g., `/dashboard` for admins, `/achievements` for students).
- **Backend Routing:** Grouped by entities (`/api/achievements`, `/api/auth`, `/api/portfolio`).
- **Database:** Hosted locally/cloud via `MONGO_URI`.

## 3. Key Services
- **Auth Service:** Issues JWT tokens on successful `/api/auth/login`.
- **Portfolio Generation Service:** Integrates student profiles, placement data, and approved achievements into HTML templates, converting them to PDF via Puppeteer.
- **AI Enhancer:** Python FastAPI microservice integration (optional) to enhance career objectives and bios based on student skills.

## 4. Security Configuration
- **CORS:** Configured to restrict access to trusted client URLs.
- **Environment Variables:** Secrets (JWT, DB connection) abstracted using `dotenv`.
