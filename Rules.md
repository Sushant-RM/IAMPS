# Project Rules & Guidelines

## 1. Development Workflow
- Ensure MongoDB is running locally or connection string is updated in `.env`.
- Frontend runs on port 3000 (`npm run dev` in `/frontend`).
- Backend runs on port 5000 (`npm run dev` in `/backend`).

## 2. Coding Standards
- **Component Design:** React components must be functional and utilize Hooks.
- **Styling:** Use standard Tailwind CSS classes. Avoid inline styles unless strictly necessary.
- **Error Handling:** Backend controllers must wrap logic in `try-catch` blocks and return appropriate HTTP status codes (e.g., 400 for bad input, 500 for server errors).
- **Environment Variables:** Never commit `.env` files. Ensure all new variables are added to `.env.example`.

## 3. Database Modifications
- When modifying schemas in `backend/models`, ensure `backend/seed.js` is updated to reflect the new structure.
- Always run `npm run seed` after major DB structural changes during development.

## 4. Git Flow
- Push functional changes to isolated feature branches.
- Commit messages should be descriptive and concise.
