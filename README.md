# Company OS — Company Management App (MVP)

A working starter build of the app described in the requirements doc: employee
management, projects, tasks, attendance, notifications, reporting, and a
skill-based job-assignment matcher — with role-based access for
Owner / Admin / Manager / Employee.

This is a **real, runnable MVP**, not a mockup: a Node/Express API and a
React (Vite) frontend that talks to it over REST + JWT auth.

## Stack (what's actually in this build vs. the fuller architecture)

The original architecture doc recommended PostgreSQL, Redis, Socket.IO, etc.
for a production/multi-tenant SaaS. For a fast, dependency-free MVP that runs
anywhere Node runs, this build simplifies to:

| Layer | Original recommendation | This MVP |
|---|---|---|
| Backend | NestJS / FastAPI | Express (Node.js) |
| Database | PostgreSQL | JSON file store (`backend/db/store.js`) — same interface, swappable |
| Auth | OAuth2/OIDC, MFA | JWT (email + password), roles |
| Real-time | WebSockets/Socket.IO | Polling via REST (notifications list) |
| Frontend | React/Next.js | React + Vite |

The JSON store in `backend/db/store.js` exposes `all / find / filter / insert
/ update / remove`, so route files never touch the storage format directly —
swapping in Postgres later means rewriting that one file, not the routes.
See "Moving to Postgres" below.

## Features included in this MVP

- **Auth**: register/login, JWT, 4 roles (owner, admin, manager, employee).
  First registered user automatically becomes the owner.
- **Employees**: directory, add/edit (owner/admin), skills, department, grade.
- **Projects**: create/update, status, budget vs. actual cost, auto-computed
  progress % from linked tasks.
- **Tasks**: create/assign/move between To do → In progress → Done, priority,
  due dates. Assigning a task creates a notification for that employee.
- **Attendance**: check-in/out, leave requests, per-employee summary.
- **Notifications**: personal feed + owner/admin broadcast announcements.
- **Reports**: `/api/reports/dashboard` aggregates headcount, attendance,
  project/task status breakdowns, overdue tasks, budget utilization.
- **Job-assignment matcher**: `POST /api/employees/match` scores employees
  against required skills (weighted skill-match + seniority), matching the
  "Job Assignment" rules-engine concept from the requirements doc.

## Running it locally

### Backend

```bash
cd backend
npm install
cp .env.example .env      # edit JWT_SECRET for anything beyond local testing
npm run seed               # creates demo data + 3 demo accounts
npm start                  # runs on http://localhost:4000
```

Demo accounts (password `password123` for all):
- `owner@company.com` — full access
- `manager@company.com` — can manage projects/tasks
- `rahul@company.com` — employee view, can check in/out

### Frontend

```bash
cd frontend
npm install
npm run dev                 # runs on http://localhost:5173
```

The frontend reads the API URL from `frontend/.env` (`VITE_API_URL`), already
set to `http://localhost:4000/api`.

Open `http://localhost:5173`, sign in with a demo account (or register a
brand-new owner account — the first person to register on a fresh database
becomes the owner automatically).

## Project structure

```
backend/
  server.js           # Express app entrypoint
  db/store.js          # JSON file datastore (swap for Postgres later)
  db/seed.js           # demo data generator
  middleware/auth.js    # JWT verification + role-based authorize()
  routes/               # auth, employees, projects, tasks, attendance,
                         # notifications, reports, company
frontend/
  src/api.js            # typed fetch wrapper for every backend endpoint
  src/AuthContext.jsx    # login/register/logout + session restore
  src/Layout.jsx         # sidebar navigation shell
  src/pages/             # Dashboard, Employees, Projects, Tasks,
                         # Attendance, Notifications, Login
```

## Moving to Postgres (when you outgrow the JSON store)

1. Use the SQL schema sketch from the original requirements doc as your
   starting migration (employees, tasks, projects, attendance tables).
2. Add `pg` (or an ORM like Prisma/Drizzle) to `backend/package.json`.
3. Reimplement the five methods in `db/store.js`
   (`all/find/filter/insert/update/remove`) against SQL queries. Every route
   file calls these methods generically (e.g. `store.all('tasks')`), so no
   route code needs to change if you keep the same method signatures.
4. Add `tenant_id` filtering at the query level if you go multi-tenant (the
   data already carries a `tenantId` field, currently unused for filtering
   since this MVP is single-tenant).

## What's deliberately left out of the MVP (see the original architecture doc)

- Multi-tenant isolation (row-level security), SSO, MFA
- Real-time WebSocket presence/activity feed (notifications currently poll)
- Calendar/Slack/Jira integrations
- Advanced report builder with saved filters and scheduled exports
- File attachments / object storage
- Audit log UI (the backend already records task status changes in
  `auditLogs` — just not surfaced in the frontend yet)

These are natural "V1" additions once the MVP validates the core workflows.
