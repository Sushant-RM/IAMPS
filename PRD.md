# Product Requirements Document (PRD)

## 1. Product Overview
The **Achievement Management System** is a unified platform designed for educational institutions to track, verify, and showcase student accomplishments. It bridges the gap between student self-reporting and official institutional verification.

## 2. Target Audience (Personas)
- **Students:** Can log in, submit new achievements (hackathons, sports, research papers), view their approval status, and automatically generate professional portfolios.
- **HODs / Department Admins:** Review pending achievements submitted by students in their department, and approve/reject them with feedback.
- **System Admin:** Manages departments, faculty, and overarching system data.

## 3. Key Features

### 3.1 Student Portal
- **Authentication:** Secure login using Email or USN.
- **Achievement Submission:** Form to submit title, category, department, date, and description.
- **Status Tracking:** View history of achievements with real-time status updates (Pending, Approved, Rejected).
- **AI Portfolio Generation:** Automatically compile approved achievements, verified dataset metrics (CGPA, skills), and AI-generated bio/headlines into an exportable PDF/DOCX.

### 3.2 Admin Portal
- **Dashboard:** Visual charts (Pie/Bar) showing distribution of achievements by category and status.
- **Approval Workflow:** Interface to approve or reject student submissions, including providing reasons for rejection.

## 4. Non-Functional Requirements
- **Performance:** Fast response times using Next.js Server-Side features and optimized MongoDB indexing.
- **Security:** Role-based access control (RBAC), bcrypt password hashing, and secure JWT authentication.
- **Usability:** Mobile-responsive frontend using Tailwind CSS.
