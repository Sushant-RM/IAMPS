# 📋 Final Verification Guide — Research Ecosystem

> **Last Updated**: Reflects all changes as of the latest refactoring session.

This guide walks through every feature of the application from start to finish.
Complete each step in order — later steps depend on data created in earlier steps.

---

## ⚙️ Prerequisites

Before starting, verify both servers are running:

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm run dev
```

**Required file** — `frontend/.env.local` must exist with:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Database must be seeded** — Run this once to populate all users, papers, and events:
```bash
cd backend
npm run seed
```

---

## 🔑 Quick Credential Reference

| Role | Login Identifier | Password | Notes |
|---|---|---|---|
| System Admin | `admin@college.edu` | `Admin@2025` | Full system access |
| HOD (CSE) | `ramesh.kumar@college.edu` | `User@123` | Has admin role |
| HOD (ECE) | `pradeep.nair@college.edu` | `User@123` | Has admin role |
| HOD (EEE) | `kavitha.reddy@college.edu` | `User@123` | Has admin role |
| HOD (ME) | `vijay.menon@college.edu` | `User@123` | Has admin role |
| HOD (CE) | `rajan.shah@college.edu` | `User@123` | Has admin role |
| HOD (IT) | `deepika.gupta@college.edu` | `User@123` | Has admin role |
| Faculty (CSE) | `sunita.sharma@college.edu` | `User@123` | Reviews CSE papers only |
| Faculty (CSE) | `anil.verma@college.edu` | `User@123` | — |
| Faculty (ECE) | `meena.pillai@college.edu` | `User@123` | — |
| Student (CSE) | USN: `1MS22CSE001` | `User@123` | **Arjun Sharma** |
| Student (CSE) | USN: `1MS22CSE002` | `User@123` | Priya Verma |
| Student (ECE) | USN: `1MS22ECE001` | `User@123` | Siddharth Gupta |
| Student (EEE) | USN: `1MS22EEE001` | `User@123` | Rohan Rao |
| Student (ME) | USN: `1MS22ME001` | `User@123` | Aditya Iyer |
| Student (CE) | USN: `1MS22CE001` | `User@123` | Ajay Malhotra |
| Student (IT) | USN: `1MS22IT001` | `User@123` | Pranav Sinha |

> Full list of all 30 students + 15 faculty is in `backend/mock_users.json`.

---

## Phase 1 — Health Check

### ✅ Step 1: Verify Backend
1. Open: **http://localhost:5000/api/health**
2. ✅ **Expected**: `{"status":"ok","database":"connected"}`
3. ❌ If you see `"database":"disconnected"`: check your `backend/.env` `MONGO_URI` value and restart the backend.

---

## Phase 2 — Navigation & Auth UI

### ✅ Step 2: Verify Navbar When Logged Out
1. Open: **http://localhost:3000**
2. ✅ **Expected**: Navbar shows **Login** and **Register** buttons on the right side.
3. ✅ No profile dropdown, no user avatar visible.

### ✅ Step 3: System Admin Login
1. Go to: **http://localhost:3000/login**
2. In the **Email or USN** field, enter: `admin@college.edu`
3. **Password**: `Admin@2025`
4. Click **Sign In**.
5. ✅ **Expected**: Redirected to `/dashboard/admin`.
6. ✅ **Navbar check**: Top-right now shows an avatar with initials **SA** (System Administrator). Click it to see the profile dropdown with name, role badge **admin**, and a red **Sign Out** button.

### ✅ Step 4: Verify Admin Dashboard Stats
1. Go to: **http://localhost:3000/dashboard/admin**
2. ✅ **Expected**: Stats cards show **Total Papers: 15+**, Approved: 15, Pending: 0 (seeded papers are pre-approved).

### ✅ Step 5: Verify Analytics Charts (Real Data)
1. Go to: **http://localhost:3000/admin/analytics**
2. ✅ **Expected**: Charts load with **real data** from the database:
   - "Publication Volume Over Time" chart shows bars for 2021, 2022, 2023, 2024, 2025.
   - "Papers by Department" shows all 6 departments (CSE, ECE, EEE, ME, CE, IT).
   - "Paper Types" pie chart shows Journal, Conference, and Thesis slices.
   > ℹ️ These are no longer demo/placeholder charts — they show actual aggregated data from MongoDB.

### ✅ Step 6: Verify Department HODs
1. Go to: **http://localhost:3000/admin/departments** (or equivalent admin departments link).
2. ✅ **Expected**: 6 departments listed, each with the correct HOD name:
   - CSE → Dr. Ramesh Kumar
   - ECE → Dr. Pradeep Nair
   - EEE → Dr. Kavitha Reddy
   - ME → Dr. Vijay Menon
   - CE → Dr. Rajan Shah
   - IT → Dr. Deepika Gupta

### ✅ Step 7: Verify Users Management
1. Go to: **http://localhost:3000/admin/users**
2. ✅ **Expected**: List of ~46 users (1 System Admin + 6 HODs + 9 Faculty + 30 Students), sorted by role.

### ✅ Step 8: Admin Creates an Institutional Event
1. Click **Create Event** on the Admin Dashboard, or go to: **http://localhost:3000/admin/events/create**
2. Fill in:
   - **Title**: `Annual Research Fest 2025`
   - **Type**: `Conference`
   - **Date**: Any future date (e.g., 2025-12-15)
   - **Venue**: `Main Auditorium`
   - **Organizer**: `Research Cell`
   - **Description**: `Annual showcase of student and faculty research`
   - **Max Participants**: `200`
3. Click **Create Event**.
4. ✅ **Expected**: Success message. Event created.
5. ✅ **Atlas check**: `minor_project` → `events` → new document with `status: "approved"` (admin-created events are auto-approved).

### ✅ Step 9: Admin Logout
1. Click your avatar in the top-right navbar.
2. Click the red **Sign Out** button in the dropdown.
3. ✅ **Expected**: Redirected to `/login`. Navbar shows Login/Register again.

---

## Phase 3 — HOD Flow

### ✅ Step 10: HOD Login
1. Go to: **http://localhost:3000/login**
2. **Email**: `ramesh.kumar@college.edu`
3. **Password**: `User@123`
4. ✅ **Expected**: Redirected to `/dashboard/admin` (HODs are assigned the `admin` role).
5. ✅ **Navbar**: Avatar shows initials **RK** with role badge **admin**.
6. Click the avatar → **Sign Out**.

---

## Phase 4 — Student Flow

### ✅ Step 11: Student Login via USN
1. Go to: **http://localhost:3000/login**
2. In **Email or USN**: enter `1MS22CSE001` *(no email, just the USN)*
3. **Password**: `User@123`
4. ✅ **Expected**: Redirected to `/dashboard/student`, welcomed as **Arjun Sharma**.
5. ✅ **Navbar**: Avatar shows initials **AS**, role badge **student**, and USN `1MS22CSE001` visible in the dropdown.

### ✅ Step 12: Student Login via Email (Alternative)
1. Log out. Go back to `/login`.
2. **Email**: `1ms22cse001@college.edu` (lowercase email form of USN)
3. **Password**: `User@123`
4. ✅ **Expected**: Logs in as the same user — **Arjun Sharma**. USN mapping is permanent.

### ✅ Step 13: Access Quick Links from Navbar
1. While logged in as Arjun Sharma, click the avatar in the navbar.
2. ✅ **Expected dropdown items**: My Dashboard, Submit Paper, Submit Event Proof, My Events, Sign Out.
3. Click **Submit Paper** — verify it opens `/upload/paper`.
4. Go back.

### ✅ Step 14: Submit a Research Paper
1. Go to: **http://localhost:3000/upload/paper**
2. Fill in:
   - **Title**: `Machine Learning in Healthcare Diagnostics`
   - **Type**: `Research Paper`
   - **Abstract**: `This paper explores ML applications in diagnostic imaging using deep learning.`
   - **Authors**: `Arjun Sharma`
   - **Department**: `Computer Science`
   - **Year**: `2025`
   - Upload any **PDF file** from your computer
   > ⚠️ Only PDF files are accepted (max 10 MB). Non-PDF uploads will be rejected with an error.
3. Click **Submit Paper**.
4. ✅ **Expected**: Success notification — "Paper submitted for review."
5. ✅ **Atlas check**: `minor_project` → `papers` → new document with `status: "pending_faculty"`.

### ✅ Step 15: RSVP for Admin Event
1. Go to: **http://localhost:3000/events**
2. ✅ **Expected**: `Annual Research Fest 2025` and the 2 seeded events (National Tech Symposium, AI & ML Workshop) are listed.
3. Click **RSVP** on `Annual Research Fest 2025`.
4. ✅ **Expected**: Confirmation notification — "You are registered for Annual Research Fest 2025."
5. ✅ **Atlas check**: The event document's `participants` array now contains Arjun Sharma's `_id`.

### ✅ Step 16: Submit External Event Participation
1. From the navbar avatar dropdown, click **Submit Event Proof** (or go to **http://localhost:3000/events/submit**).
2. Fill in:
   - **Event Title**: `Smart India Hackathon 2024`
   - **Type**: `Hackathon`
   - **Organizer**: `Ministry of Education`
   - **Date**: `2024-12-10`
   - **Venue**: `Online`
   - **Outcome**: `2nd Prize` *(free-text — any prize name is accepted now!)*
   - Upload any **PDF or image** as the certificate (max 5 MB)
3. Click **Submit Participation**.
4. ✅ **Expected**: Redirected to `/events/my`.
5. ✅ **Atlas check**: `minor_project` → `events` → new document with `status: "pending"` and `certificateUrl` field set.

### ✅ Step 17: View My Submitted Events
1. Go to: **http://localhost:3000/events/my** (or from navbar dropdown → My Events).
2. ✅ **Expected**: `Smart India Hackathon 2024` listed with status **Pending**.

### ✅ Step 18: Check Student Dashboard
1. Go to: **http://localhost:3000/dashboard/student**
2. ✅ **Expected**: Shows stats: 1 paper submission, 1 RSVP, 1 external event pending.

### ✅ Step 19: Student Logout
1. Click avatar in navbar → **Sign Out**.
2. ✅ **Expected**: Redirected to `/login`.

---

## Phase 4A — Student Achievements Flow

### ✅ Step 19A: Student Login & Submit Achievement
1. Go to: **http://localhost:3000/login**
2. In **Email or USN**: enter `1MS22CSE001`
3. **Password**: `User@123`
4. Go to: **http://localhost:3000/achievements/create**
5. Fill in:
   - **Student Name**: `Arjun Sharma`
   - **USN**: `1MS22CSE001`
   - **Department**: `CSE`
   - **Category**: `Technical`
   - **Achievement Title**: `National Coding Championship 2025`
   - **Description**: `Won first place in the college-level coding challenge.`
   - **Achievement Date**: `2025-05-20`
   - **Certificate Link**: `https://example.com/certificates/arjun-coding.pdf`
6. Click **Create Achievement**.
7. ✅ **Expected**: Redirected to `/achievements`.
8. ✅ **Expected**: `National Coding Championship 2025` is listed with status **Pending**.
9. Click avatar in navbar → **Sign Out**.

---

## Phase 5 — Faculty Review Flow

### ✅ Step 20: Faculty Login
1. Go to: **http://localhost:3000/login**
2. **Email**: `sunita.sharma@college.edu` *(CSE faculty — same dept as the submitted paper)*
3. **Password**: `User@123`
4. ✅ **Expected**: Redirected to `/dashboard/faculty`.
5. ✅ **Navbar**: Avatar shows role badge **faculty**.

### ✅ Step 21: Review the Submitted Paper (Stage 1)
1. On the faculty dashboard, the left queue panel should show **Machine Learning in Healthcare Diagnostics**.
   > Only papers with `status: "pending_faculty"` in the CSE department appear here.
2. Click the paper card to select it.
3. Click **Initialize Review** to unlock the approval buttons.
   > ⚠️ **PDF Viewer Note**: Chrome may block `localhost` PDFs. If the inline viewer is blank, click the **External Media Access** fallback link to open the PDF in a new tab. The Approve/Reject buttons are unlocked by clicking "Initialize Review", not by viewing the PDF.
4. Optionally add a comment, then click **✓ Approve Paper**.
5. ✅ **Expected**: Paper disappears from the faculty queue.
6. ✅ **Atlas check**: `minor_project` → `papers` → `status` is now `"pending_admin"` *(NOT "approved" — this is the correct 2-stage workflow!)*
7. ✅ **Notification check**: Arjun Sharma receives a notification: "Paper Forwarded for Admin Review."

### ✅ Step 22: Faculty Logout
1. Click avatar → **Sign Out**.

---

## Phase 6 — Admin Final Approval Flow

### ✅ Step 23: Admin Login & Final Approval
1. Login as `admin@college.edu` / `Admin@2025`.
2. Go to **http://localhost:3000/dashboard/admin**.
3. The **Institutional Queue** (right side panel) should show **Machine Learning in Healthcare Diagnostics** with status `pending_admin`.
4. Click the paper card.
5. Click **Initialize Review**, then click **✓ Approve & Publish**.
6. ✅ **Expected**: Paper disappears from the admin queue.
7. ✅ **Atlas check**: `minor_project` → `papers` → `status: "approved"`.
8. ✅ **Notification check**: Arjun Sharma receives "🎉 Paper Approved & Published!"

### ✅ Step 24: Approve External Event Submission
1. Navigate to the Admin Dashboard's event approvals section (or `/admin/events`).
2. `Smart India Hackathon 2024` should appear with status **Pending**.
3. Click **Approve**.
4. ✅ **Expected**: Status changes to **Approved**.
5. ✅ **Expected DB check**: Event document `status: "approved"`.

### ✅ Step 24A: Approve Student Achievement (Admin/HOD)
1. Go to: **http://localhost:3000/dashboard/achievements**
2. ✅ **Expected**: Dashboard statistics cards show **Pending: 1** (or more).
3. Click **View All Achievements** (or go to **http://localhost:3000/achievements?status=pending**).
4. Find `National Coding Championship 2025` in the list, and click **View**.
5. Click the green **Approve** button.
6. ✅ **Expected**: Status changes to **Approved**.
7. ✅ **Expected DB check**: `minor_project` → `achievements` → document `status: "approved"` and `approvedBy` has the admin's ObjectId.
8. Click avatar in navbar → **Sign Out**.

---

## Phase 7 — Public Pages Verification

### ✅ Step 25: Browse Published Papers (Public)
1. Open a **private/incognito browser tab** (or log out completely).
2. Go to: **http://localhost:3000/browse-papers**
3. ✅ **Expected**: The library shows **Machine Learning in Healthcare Diagnostics** (just approved) plus all **15 seeded papers**. Search and filter should work.

### ✅ Step 27: View Faculty Directory
1. Go to: **http://localhost:3000/faculty**
2. ✅ **Expected**: Real faculty names appear (Dr. Ramesh Kumar, Prof. Sunita Sharma, etc.) with their department affiliations.

### ✅ Step 28: View Departments Page
1. Go to: **http://localhost:3000/departments**
2. ✅ **Expected**: 6 department cards (CSE, ECE, EEE, ME, CE, IT), each with HOD name and paper counts.

---

## Phase 8 — Portfolio Generation

### ✅ Step 29: Open Portfolio Page & Verify Tabbed Arrangement
1. Login as USN `1MS22CSE001` / `User@123` (Arjun Sharma).
2. Go to: **http://localhost:3000/portfolio**
3. ✅ **Expected**: Left panel shows the **Portfolio Builder** split into three tabs:
   - **📝 Resume Edit**: Headline, Bio, Objective, and Technical Skills.
   - **🎓 Academics**: Institutional Profile and Linked Documents.
   - **🤖 AI Insights**: Dataset metrics and FastAPI career analytics.
4. Click through each tab to verify responsive rendering.

### ✅ Step 29A: Test Granular "AI Polish" Feature
1. On the **📝 Resume Edit** tab, type some text in any edit field (e.g., *Headline* or *Bio*).
2. Click the **✨ AI Polish** button next to that field.
3. ✅ **Expected**: The button shows `✨ Polishing...` while invoking the LLM with a tailored prompt.
4. ✅ **Expected**: Only that specific text field updates to a polished professional description without modifying the other fields.
5. Click **Save Draft** (or press `Ctrl+S`) to save edits.

### ✅ Step 29B: Generate AI Portfolio
1. Click the main **✦ Generate with AI** button at the top of the builder panel.
2. ✅ **Expected**: AI-generated portfolio sections render in the A4 Preview pane showing Arjun's approved paper, CGPA, and event participation.

### ✅ Step 30: Download Portfolio as PDF & Verify Layout
1. Click the **PDF** button.
2. ✅ **Expected**: The button shows a loader and text **"Generating..."**.
3. The browser downloads `Arjun_Sharma_Portfolio.pdf`.
4. Open the PDF and verify:
   - **Dynamic Skills Grid**: Actual skills list renders as styled tags.
   - **Academic Template**: Clean serif margins and citation styling without bullet overlap.
   - **Professional Template**: Clean left borders and elegant alignment.

### ✅ Step 30A: Download Portfolio as DOCX & Verify Headers
1. Click the **DOCX** button.
2. The browser downloads `Arjun_Sharma_Portfolio.docx`.
3. Open the document in Word and verify:
   - **Header Metabar**: Contains contact details (`Email | Dept | CGPA | USN`) directly under the name.
   - **Technical Skills**: Renders the summary paragraph followed by a bold blue list of core platform skills.

### ✅ Step 31: Switch Portfolio Theme
1. Click **Academic** (or **Professional**) in the theme selector.
2. ✅ **Expected**: The preview re-renders instantly with the appropriate theme styles.

---

## Phase 9 — Security & Edge Case Verification

### ✅ Step 32: File Type Validation
1. Log in as a student, go to `/upload/paper`.
2. Try uploading a `.jpg` or `.docx` file (not a PDF).
3. ✅ **Expected**: Rejection error message — "Only PDF files are allowed for paper submissions."

### ✅ Step 32A: Test Robust Safe JSON Parsing
1. Send a POST request to `/api/papers` or `/api/events` with a malformed/invalid JSON string for the `authors` or `teamMembers` field.
2. ✅ **Expected**: Server returns `400 Bad Request` with an explicit message (`Invalid authors format` / `Invalid format for teamMembers`) instead of throwing an unhandled 500 error.

### ✅ Step 32B: Test Workflow State Action Validators
1. Send a PUT request to `/api/papers/:id/status` with an invalid action value (e.g. `{ "action": "hack_status" }`).
2. ✅ **Expected**: Server returns `400 Bad Request` explaining that only `approve`, `reject`, or `request_revision` actions are valid.

### ✅ Step 33: Unauthorized Access Guard
1. Log out completely.
2. Try to access: **http://localhost:3000/dashboard/admin**
3. ✅ **Expected**: Redirected to `/login` (auth guard is active).

### ✅ Step 34: Auto-Logout on Expired Token
- If a user's session token expires, the response interceptor in `frontend/lib/api.ts` intercepts the `401` status, clears `localStorage` credentials, and redirects to `/login` smoothly.

### ✅ Step 35: Correct 2-Stage Paper Approval Workflow
- Enforce the transition logic: Faculty approval sets status to `pending_admin` (stage 1); Admin approval sets status to `approved` (stage 2).

---

## ✅ Verification Completion Checklist

| # | Feature | URL | DB Collection | Status |
|---|---|---|---|---|
| 1 | Health Check | `/api/health` | — | ☐ |
| 2 | Navbar (logged out) | `/` | — | ☐ |
| 3 | System Admin Login | `/login` | — | ☐ |
| 4 | Admin Dashboard Stats | `/dashboard/admin` | — | ☐ |
| 5 | Analytics (real data) | `/admin/analytics` | `papers` | ☐ |
| 6 | HODs assigned to departments | `/admin/departments` | `departments` | ☐ |
| 7 | Users Management (46 users) | `/admin/users` | `users` | ☐ |
| 8 | Admin creates event | `/admin/events/create` | `events` ✍️ | ☐ |
| 9 | Admin logout via navbar | navbar | — | ☐ |
| 10 | HOD login (admin role) | `/login` | — | ☐ |
| 11 | Student USN login | `/login` | — | ☐ |
| 12 | Student email login (alt) | `/login` | — | ☐ |
| 13 | Navbar quick links (student) | navbar | — | ☐ |
| 14 | Submit paper (PDF only) | `/upload/paper` | `papers` ✍️ | ☐ |
| 15 | RSVP admin event | `/events` | `events` ✍️ | ☐ |
| 16 | Submit external event cert | `/events/submit` | `events` ✍️ | ☐ |
| 17 | View my events | `/events/my` | — | ☐ |
| 18 | Student dashboard stats | `/dashboard/student` | — | ☐ |
| 19 | Student logout via navbar | navbar | — | ☐ |
| 19a| Submit student achievement | `/achievements/create` | `achievements` ✍️ | ☐ |
| 20 | Faculty login | `/login` | — | ☐ |
| 21 | Faculty review → pending_admin | `/dashboard/faculty` | `papers` ✍️ | ☐ |
| 23 | Admin final approval → approved | `/dashboard/admin` | `papers` ✍️ | ☐ |
| 24 | Approve external event | admin dashboard | `events` ✍️ | ☐ |
| 24a| Approve student achievement | `/dashboard/achievements` | `achievements` ✍️ | ☐ |
| 25 | Browse published papers (public) | `/browse-papers` | — | ☐ |
| 27 | Faculty directory | `/faculty` | — | ☐ |
| 28 | Departments page | `/departments` | — | ☐ |
| 29 | Tabbed Builder Layout | `/portfolio` | — | ☐ |
| 29a| Granular "AI Polish" buttons | `/portfolio` | — | ☐ |
| 29b| Generate AI Portfolio | `/portfolio` | `portfolios` ✍️ | ☐ |
| 30 | Portfolio PDF with Loader | `/portfolio` | — | ☐ |
| 30a| Word DOCX Export with Header | `/portfolio` | — | ☐ |
| 32 | File type rejection | `/upload/paper` | — | ☐ |
| 32a| Robust Safe JSON Parser | — | — | ☐ |
| 32b| Workflow State Action Validators | — | — | ☐ |
| 33 | Auth guard redirect | `/dashboard/admin` | — | ☐ |
| 35 | 2-stage workflow confirmed | — | `papers` | ☐ |

---

## 🗄️ MongoDB Atlas Quick Reference

All data lives in the **`minor_project`** database. Key collections:

| Collection | Contents |
|---|---|
| `users` | 46 users (admin, HODs, faculty, students) |
| `departments` | 6 departments with HODs assigned |
| `papers` | 15 seeded + any newly submitted papers |
| `events` | 3 seeded + admin-created + student-submitted events |
| `portfolios` | Created when students generate their portfolio |
| `notifications` | Auto-created on paper approvals, RSVPs, etc. |

> **Do NOT delete** the `minor_project` database.
> You can safely delete the `sample_airbnb`, `sample_mflix`, `sample_geospatial`, `sample_training`, `sample_weatherdata` databases — those are Atlas tutorial datasets and are unrelated to this project.
