# Application Flow

## 1. Authentication Flow
1. User visits `/login`.
2. Enters credentials (Email/USN and Password).
3. Backend validates via `/api/auth/login`.
4. Returns JWT and user role (`student`, `faculty`, `admin`).
5. Frontend redirects based on role:
   - Admin/Faculty -> `/dashboard` (Analytics & Pending Approvals)
   - Student -> `/achievements` (Personal History & Creation)

## 2. Achievement Submission Flow (Student)
1. Navigate to `/achievements/create`.
2. Fill out details (Title, Category, Department, Date, etc.).
3. Submit form -> `POST /api/achievements`.
4. Achievement is saved in DB with `status = pending`.
5. User is redirected to `/achievements` to see pending status.

## 3. Approval Flow (Admin/HOD)
1. Log into Dashboard (`/dashboard`).
2. Fetch pending achievements via `GET /api/achievements?status=pending`.
3. Admin clicks **Approve** -> `PUT /api/achievements/:id/approve`.
4. Status changes to `approved`. The approved achievement is now eligible for portfolio generation.

## 4. Portfolio Generation Flow
1. Student navigates to `/portfolio`.
2. Frontend fetches approved achievements and papers.
3. User clicks "Generate".
4. Backend compiles data, retrieves placement metrics, and formats them.
5. User downloads via `/api/portfolio/export/pdf` or `/api/portfolio/export/docx`.
