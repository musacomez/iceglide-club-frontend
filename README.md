# IceGlide Club — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind frontend for the existing
`iceglide-club-db` Cloudflare Worker API. The backend was **not modified** —
every screen here calls one of the Worker's real, existing endpoints.

## 1. Setup

```bash
npm install
cp .env.example .env.local   # then edit NEXT_PUBLIC_API_URL if needed
npm run dev
```

`.env.local`:
```
NEXT_PUBLIC_API_URL=https://iceglide-club-db.musa-comez95.workers.dev
```

Then verify before treating anything as done:
```bash
npm run lint
npm run build
```
**These two commands have not been run in this environment** — the sandbox
this project was written in has no network access, so `npm install` can't
complete here. Please run them yourself; if `build` or `lint` surfaces
anything, it's almost certainly a small type nit (see §5) rather than a
structural problem, since every page was written directly against the real
route handlers in `iceglide-club-db-main/src/routes/*.ts`.

## 2. Test accounts

The Worker's D1 database has whatever users your migrations/seed created.
Log in with any active user's email/password from the `users` table — the
role returned by `/api/me` decides which dashboard you land on
(`admin → /admin`, `head_coach → /coach`, `instructor → /instructor`,
`parent → /parent`, `student → /student`).

## 3. What's actually implemented, and why it's smaller than the original brief

The brief (in `README` from the task prompt) describes a lesson-request
workflow, admin package/payment management, and per-role CRUD that **do not
exist in the backend**. I read every file in `src/routes/`, `src/index.ts`,
`src/middleware/auth.ts`, and the D1 schema before writing any frontend code,
and built strictly against what's really there. The full route table:

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/login` | returns `{ token, user }` |
| GET | `/api/me` | current user |
| GET | `/api/dashboard/summary` | **admin + head_coach only** |
| GET | `/api/students` | role-scoped list, `?status=&search=` |
| GET | `/api/students/:id` | detail + parents + instructors + packages |
| GET | `/api/lessons?from=&to=` | role-scoped calendar feed |
| GET | `/api/lessons/:id` | detail + roster + attendance |
| GET | `/api/lessons/:id/attendance` | |
| POST | `/api/attendance` | admin/head_coach, or the assigned instructor |
| GET | `/api/packages/student/:id` | **per-student only, no list-all** |
| GET | `/api/payments/student/:id` | **per-student only, no list-all**, and instructors are not authorized (see `canAccessStudent` in `payments.ts`) |

Consequences for the frontend, deliberately, per the brief's own rule
("don't show a feature the backend doesn't support"):

- **No lesson-request UI.** The `private_lesson_requests` table exists and its
  pending count feeds the admin dashboard, but there's no endpoint to create,
  list, approve, or reject a request. Building that UI would mean either
  inventing endpoints or shipping buttons that always 404.
- **No lesson creation/editing, no instructor/student assignment UI.** Same
  reason — no backend route for it.
- **No standalone "all packages" / "all payments" admin screens.** Since the
  API only serves these per-student, `/admin/packages` and `/admin/payments`
  are a student picker + that student's list, rather than a fabricated
  aggregate table.
- **`head_coach` and `admin` are functionally identical in the UI**, because
  the backend's `withRoles(['admin', 'head_coach'], …)` never distinguishes
  them beyond that shared check.
- **Instructors don't see payments** on a student's page, because
  `canAccessStudent()` in `payments.ts` doesn't grant instructors access
  (it does for packages).

## 4. Architecture

```
src/
  app/                     # routes, one folder per role section
    admin/ coach/ instructor/ parent/ student/ login/
  components/
    ui/                    # Button, Input, Select, Modal, Toast, DataTable, etc.
    layout/                # Sidebar, Header, AppShell, RoleGuard
    calendar/              # Calendar (day/week/month), LessonDetailModal, layout algorithm
    students/ packages/ payments/ dashboard/
  lib/
    api/client.ts          # single fetch wrapper: base URL, auth header, error normalization
    api/endpoints.ts       # one typed function per real endpoint
    auth/AuthProvider.tsx  # session state, login/logout, /me refresh
    auth/roles.ts          # role → home route, role → nav items
    utils/                 # date + currency/date formatting helpers
  types/api.ts             # types mirrored 1:1 from the Worker's SQL selects
  middleware.ts            # cookie-presence redirect only (not real auth)
```

**One `Calendar` component, not five.** Admin/coach/instructor/parent/student
calendar pages all render the same `<Calendar />`, since `GET /api/lessons`
is already scoped server-side per role — the only per-role difference is
whether `canMarkAttendance` is passed (true for admin/head_coach/instructor).
Same pattern for students/packages/payments: one `StudentsTable`,
`PackagesList`, `PaymentsList`, `StudentDetailView` reused across role routes.

**Security boundary.** All the frontend's role checks
(`RoleGuard`, `middleware.ts`) are UX only — they stop a user from *seeing* a
screen they shouldn't, nothing more. The Worker API is the actual authority:
every request carries the JWT, and `withAuth`/`withRoles`/`canAccessStudent`/
`canAccessLesson` on the backend are what actually enforce access. This
mirrors the brief's own instruction not to move backend security into the
frontend.

**Calendar implementation.** `components/calendar/lessonLayout.ts` does a
greedy interval-graph column-packing pass so lessons that overlap in time sit
side-by-side instead of stacking. Day/week views render a real time axis
(07:00–21:00); month view shows up to 3 lesson chips per day with a "+N more"
overflow, and clicking a day drops you into day view. Every lesson opens a
detail modal (`LessonDetailModal`) with the real roster and, where the role
allows it, inline present/late/absent/excused buttons that call
`POST /api/attendance`.

## 5. Known rough edges to check on first build

- `output: 'standalone'` was deliberately **not** set in `next.config.mjs` —
  Cloudflare deployment needs either the OpenNext Cloudflare adapter
  (`@opennextjs/cloudflare`) or `@cloudflare/next-on-pages`, and I didn't want
  to wire up a specific one blind, without being able to run it. Pick one,
  add it as a dev dependency, and follow its docs' build/deploy commands —
  don't just `wrangler deploy` a raw Next.js build.
- Tailwind/PostCSS/ESLint versions are pinned to versions I know are mutually
  compatible with Next 14.2, but I couldn't run `npm install` to confirm the
  lockfile resolves cleanly in this sandbox.
- `noUncheckedIndexedAccess` is on in `tsconfig.json` (stricter than Next's
  default) — I already fixed the one spot that tripped it
  (`lessonLayout.ts`), but if `npm run build` finds another, it'll be a
  similarly small, obvious fix, not a structural issue.

## 6. Commands to run

```bash
npm install
npm run lint
npm run build
npm run dev      # http://localhost:3000
```
git push
