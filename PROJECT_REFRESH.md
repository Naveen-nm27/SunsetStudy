# SunsetStudy — project refresh

Personal cheat sheet: stack, files, screens, and how the pieces connect. The public README stays in `README.md`. Current review rules and added features are documented in `FEATURES.md`.

---

## What it is

MERN study planner based on the **Ebbinghaus forgetting curve**. You organize work as **subjects → topics**, log **sessions**, and the server schedules the next review. **Blocks** are a separate calendar for life/time (lectures, sleep, work) and are **not** linked to sessions.

---

## Tech stack

### Frontend (`/frontend`)

| Piece | Role |
|--------|------|
| **React 19** | UI |
| **Vite 8** | Dev + build (`npm run dev` → typically `http://localhost:5173`) |
| **React Router DOM 7** | Client routing |
| **Tailwind CSS 4** | Styling via `@tailwindcss/vite` |
| **Framer Motion** | Modals, toasts, page motion |
| **Axios** | HTTP; JWT from `localStorage` |
| **Moment** | Dates/times |
| **Lucide React** | Icons |
| **clsx / tailwind-merge** | Class helpers |
| **react-big-calendar** | In `package.json`; Today view is a custom list, not this widget |

API URL uses `VITE_API_URL` in `frontend/src/api.js`, defaulting to `http://localhost:3000`.

Auth on the client: `localStorage.token` + `localStorage.user` (JSON). No React auth context.

### Backend (repo root)

| Piece | Role |
|--------|------|
| **Node.js (ES modules)** | `"type": "module"` |
| **Express 5** | REST (`src/app.js`) |
| **MongoDB + Mongoose 9** | Documents |
| **JWT (`jsonwebtoken`)** | `Authorization: Bearer <token>`; payload `{ id: user._id }`; **1 day** expiry |
| **bcryptjs** | Passwords |
| **Zod 4** | Request validation |
| **cors** | Vite → API |
| **dotenv** | Root `.env` via `src/config/env.js` |
| **Node watch mode** | `npm start` reloads the API on source changes |

Entry: `index.js` (connect DB, listen). `src/server.js` is a duplicate starter.

### Other

- Postman: `postman/`
- Demo seed: `npm run seed:demo` → `scripts/seed-demo.mjs` + `seed/demo-data.json`
- Frontend ESLint 10 in `frontend/`

---

## Data model

```
User
 ├── Subjects     type: academic | hobby | project     status: active | archived
 │     └── Topics status: not started | in progress | done
 │           + reviewStage, nextReviewDate, lastStudiedAt, masteredAt, continueStudying
 │           └── Sessions   status: planned | completed
 └── Blocks       type: lecture | sleep | family | work | other
                  optional recurring weekdays
```

To-do tasks also belong to the user, with a title, priority, optional due date, and completion state.

**Sessions** = study log (subject + topic). **Blocks** = calendar only (user). Completing a session advances spaced repetition on that topic.

### Spaced repetition

Intervals (days after each credited completion): **1, 3, 7, 14, 30, 60**

- Shared policy: `shared/reviewPolicy.js`
- Server: `src/modules/topics/topics.service.js`
- Client re-export: `frontend/src/constants/spacedRepetition.js`

When a session is **created** as `completed`, or **patched** from `planned` → `completed`:

1. `completedAt` is set
2. `advanceTopicReviewSchedule` rebuilds the topic from completion history. Extra practice before the due UTC day cannot skip intervals. Seven credited completions (initial study plus six reviews) reach mastery.
3. Due topics: `nextReviewDate <= now` (`GET /topics/due-today`)

Memory Hub chart: **illustrative** exponential decay between actual completions, with the latest 30 markers. Suggested reviews end at mastery. **Keep studying** enables optional 60-day reviews; **Finish for now** pauses them. Deleting a completion rebuilds the schedule. The chart is not a measured retention score.

---

## Folder layout

```
SunsetStudy/
├── index.js                 # API process
├── src/
│   ├── app.js               # Express + CORS + JSON + routes
│   ├── db.js
│   ├── config/env.js
│   ├── middlewares/auth.js
│   ├── utils/authUser.js    # injectAuthUserId on POST
│   ├── utils/ownership.js
│   └── modules/
│       ├── users/
│       ├── subjects/
│       ├── topics/
│       ├── blocks/
│       ├── sessions/        # routes, controller, service, model, validation
│       └── todos/           # account-scoped task list
├── shared/reviewPolicy.js   # review and mastery rules
├── tests/                  # domain and HTTP/service regressions
├── frontend/src/
│   ├── App.jsx
│   ├── api.js
│   ├── pages/
│   ├── components/
│   ├── utils/
│   └── constants/
├── seed/ + scripts/seed-demo.mjs
└── postman/
```

Each backend module: **routes → controller → service → model + Zod**.

JWT on: `/subjects`, `/topics`, `/blocks`, `/sessions`, `/todos`, and user management.
`/users/register` and `/users/login` are public. User management requires authentication and is scoped to the current account.

---

## Frontend routes

| Path | File | What |
|------|------|------|
| `/` | `LandingPage.jsx` | Marketing |
| `/login` | `Login.jsx` | JWT |
| `/register` | `Register.jsx` | Then `/login` |
| `/dashboard` | redirect | → `/dashboard/memory` |
| `/dashboard/memory` | `MemoryHub.jsx` | Curve, review list, calendar URL |
| `/dashboard/timeline` | `TimelinePage.jsx` | Week/day calendar: sessions, recurring blocks, overnight events |
| `/dashboard/library` | `LibraryPage.jsx` | Subjects & topics CRUD |
| `/dashboard/sessions` | `SessionsPage.jsx` | Sessions, timer, complete |
| `/dashboard/todos` | `TodosPage.jsx` | Tasks, priorities, dates, and completion filters |
| `/profile` | `Profile.jsx` | Counts |

`ProtectedLayout` requires a token and wraps dashboard + profile in `Layout`.

### Shared components (`frontend/src/components/`)

| Component | Job |
|-----------|-----|
| `ThemeProvider` | Light/dark |
| `ToastProvider` | `useToast` |
| `ConfirmProvider` | `useConfirm` |
| `Layout` | Nav: Memory, Today, Sessions, Library, To-do, Profile; standalone Pomodoro |
| `BrandWordmark` | Logo |
| `DustParticles` | Background |
| `CreateEntityModal` | Create subject / topic / session / block |
| `ForgettingCurveChart` | SVG curve |
| `ReviewScheduleList` | Upcoming dates + Plan |
| `SessionStudyTimer` | Start a session-linked Pomodoro |
| `StudyTimerProvider` | Persistent per-account focus/break timer and settings |
| `SubjectImport` | JSON validation, preview, and batch import |
| `MasteryChoice` | Keep studying or pause after the mastery milestone |

### Client helpers

- `utils/topic.js` — populated id vs ObjectId
- `utils/reviewSchedule.js` — projected dates
- `utils/sessionTimeline.js` — chart times
- `utils/subjectColors.js`
- `utils/apiErrors.js`
- `utils/calendarEvents.js` — recurring/overnight calendar events
- `utils/pomodoro.js` — timer settings and phase transitions
- `hooks/useStudyData.js` — shared reads, refresh, and stale-account protection

---

## API

Base: `http://localhost:3000`
Protected: `Authorization: Bearer <jwt>`

### Users

Registration/login are public. User management requires a JWT and only accesses the current account; passwords are excluded from normal responses.

| Method | Path |
|--------|------|
| POST | `/users/register` |
| POST | `/users/login` → `{ token, user: { id, userName, userEmail } }` |
| GET | `/users` |
| GET/PATCH/DELETE | `/users/:id` |

### Subjects / topics / blocks / sessions / tasks (JWT)

`GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` on:

- `/subjects` — extra `POST /subjects/import` for validated subjects and nested topics
- `/topics` — extra `GET /topics/due-today`
- `/blocks`
- `/sessions` — `status: "completed"` advances the topic
- `/todos` — `GET/POST /todos`, `PATCH/DELETE /todos/:id`

POST bodies get `userObjectId` from the JWT.

---

## Env & run

Root `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sunsetstudy
JWT_SECRET=your_super_secret_jwt_key
```

MONGODB_URI and JWT_SECRET must be configured.

```bash
# terminal 1 — repo root
npm install
npm start          # http://localhost:3000

# terminal 2
cd frontend
npm install
npm run dev        # http://localhost:5173

# optional
npm run seed:demo
```

---

## Where to change X

| Change | File |
|--------|------|
| Review intervals and mastery | `shared/reviewPolicy.js` |
| CORS / mounts | `src/app.js` |
| JWT | `src/middlewares/auth.js` |
| Login payload | `src/modules/users/users.controller.js` |
| Pages | `frontend/src/App.jsx` |
| API URL | `frontend/src/api.js` |
| Theme / fonts | `frontend/src/index.css` |
| Create forms | `frontend/src/components/CreateEntityModal.jsx` |

## Web checks and packaging

Use Node.js 24 for `npm test` at the root. API tests stub database methods, so they do not change MongoDB data. In `frontend/`, run `npm run lint` and `npm run build`.

Docker Compose runs MongoDB, the Express API, and the production frontend. See the [public setup guide](README.md#run-with-docker). For a walkthrough of imports, tasks, review milestones, and timers, read [FEATURES.md](FEATURES.md).
