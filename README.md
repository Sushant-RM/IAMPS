# IAMPS — Institutional Academic Management & Portfolio System

Unified student career development platform featuring research paper workflows, achievement tracking, career analytics, role-based dashboards, and AI-powered portfolio generation with PDF/DOCX export.

**Repository:** [github.com/Sushant-RM/IAMPS](https://github.com/Sushant-RM/IAMPS)

## Features

| Area | Capabilities |
|------|----------------|
| **Students** | Dashboard, portfolio builder, achievements, paper submission, events, career insights |
| **Faculty** | Research review queue, event creation, reports |
| **HOD** | Department approvals, analytics, faculty performance, reports |
| **Admin** | User management, departments, institutional review queue, system analytics |
| **Portfolio** | Live preview, 6 themes, AI enhancement, PDF & DOCX export |
| **Security** | JWT auth, route guards, role-based access control |

## Tech Stack

- **Backend:** Node.js, Express 5, MongoDB, Mongoose, Puppeteer (PDF), docx (DOCX), Groq API (optional AI)
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts
- **Testing:** Playwright E2E

## Project Structure

```
IAMPS/
├── backend/
│   ├── models/          # User, Paper, Achievement, Portfolio, Event, etc.
│   ├── routes/          # API endpoints
│   ├── middleware/      # JWT authentication
│   ├── services/        # AI enhancer, cache
│   ├── templates/       # Portfolio HTML templates
│   ├── utils/           # PDF/DOCX generators, template engine
│   └── seed.js          # Database seeder
├── frontend/
│   ├── app/             # App Router (portfolio, achievements)
│   ├── pages/           # Pages Router (dashboards, admin)
│   ├── components/      # UI components
│   └── lib/             # Auth, API, navigation, guards
├── datasets/            # Placement analytics CSV
├── tests/               # Playwright E2E tests
└── docs/                # Planning & specification documents
```

## Prerequisites

- Node.js 22.12+ (see `.nvmrc`; `nvm use` picks it up automatically). Puppeteer's dependencies require this — Node 18/20 will emit `EBADENGINE` warnings and are not supported.
- MongoDB 6+ (local or Atlas)
- npm 9+
- On Linux, headless Chrome (used for portfolio PDF export) needs OS shared libraries beyond a bare `npm install` — see the Troubleshooting entry below, or use `backend/Dockerfile`, which installs them automatically.

Optional: Groq API key for AI portfolio enhancement; Cloudinary for cloud file uploads.

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Sushant-RM/IAMPS.git
cd IAMPS
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm install
npm run seed    # Seeds demo data; generates backend/mock_users.json locally
npm run dev     # http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

### 4. Demo Login

After seeding, credentials are written to `backend/mock_users.json` (gitignored). Typical demo accounts:

| Role | Login | Password |
|------|-------|----------|
| Admin | `admin@college.edu` | See seed output |
| Student | USN e.g. `1MS22CSE001` | See seed output |
| Faculty | faculty email from seed | See seed output |

See `backend/mock_users.example.json` for the credential file structure.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `PORT` | No | Server port (default `5000`) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `CLIENT_URL` | No | Frontend URL for CORS (default `http://localhost:3000`) |
| `GROQ_API_KEY` | No | Groq API key for AI features (`none` to disable) |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |

### Frontend (`frontend/.env.local` — optional)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default `http://localhost:5000/api`) |

## Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run dev` | `backend/` | Start API with nodemon |
| `npm start` | `backend/` | Start API (production) |
| `npm run seed` | `backend/` | Seed database + export demo credentials |
| `npm run dev` | `frontend/` | Start Next.js dev server |
| `npm run build` | `frontend/` | Production build |
| `npm test` | root | Run Playwright E2E tests |

## Architecture

```
Browser → Next.js (Route Guards) → Express API → MongoDB
                              ↓
                    Portfolio: HTML templates → Puppeteer (PDF) / docx (DOCX)
                              ↓
                    Optional: Groq API (AI text enhancement)
```

**Auth flow:** Login → JWT stored in `localStorage` → Axios attaches token → `RouteGuard` / `AppRouteGuard` enforce role-based access.

**Paper workflow:** Student submit → Faculty review → Admin institutional review → Approved & published.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `MongoDB connection failed` | Ensure MongoDB is running; verify `MONGO_URI` in `backend/.env` |
| `401 on API calls` | Log in again; check `JWT_SECRET` matches between sessions |
| `npm install` fails in `backend/` with a Puppeteer/Chromium download error | Install `unzip` (`apt-get install unzip` on Debian/Ubuntu) — Puppeteer needs it to extract the Chromium build it downloads. |
| `PDF export fails` with `error while loading shared libraries: libglib-2.0.so.0` (or similar) | The downloaded Chromium binary needs OS-level shared libraries this machine doesn't have. On Debian/Ubuntu: `apt-get install -y fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libxkbcommon0 libxshmfence1`. Or build/run `backend/Dockerfile` instead, which already includes this. |
| `AI features unavailable` | Set `GROQ_API_KEY` in `.env` or leave as `none` for fallback text |
| `Frontend build errors` | Run `npm install` in `frontend/`; use Node 22.12+ (see `.nvmrc`) |
| `CORS errors` | Set `CLIENT_URL` to your frontend origin |

## Security Notes

- Never commit `.env` files or real API keys.
- `backend/mock_users.json` is generated locally by seed and is gitignored.
- Rotate `JWT_SECRET` and API keys before production deployment.
- Demo passwords in seed data are for development only.

## Documentation

Additional planning documents in the repository root: `Schema.md`, `TechSpec.md`, `PRD.md`, `AppFlow.md`.

## License

ISC
