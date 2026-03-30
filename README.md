# Aqbobek Hub

`Aqbobek Hub` is a multi-role school platform demo built on `Next.js 16`, `React 19`, `Prisma 7` and `SQLite`.

The project is not just a UI mock. It includes:

- role-based dashboards for `student`, `teacher`, `parent`, `admin`
- a public `kiosk` screen
- a weekly `Smart Schedule` engine with constraints and reoptimization
- in-app school notifications through `Broadcast`, `KioskItem`, `EventLog`
- a student homework upload flow
- teacher workbench actions
- parent-facing progress summaries
- news, leaderboard, settings, AI assistant and mock BilimClass data endpoints

## Stack

- `Next.js 16.2.1`
- `React 19.2.4`
- `TypeScript`
- `Prisma 7.6`
- `SQLite` via `better-sqlite3`
- `Tailwind CSS 4`
- `Lucide React`
- `@google/genai` for the AI assistant

## Project Goals

This demo is designed to look and behave like a connected internal school platform where:

- students see progress, schedule, achievements, homework and recommendations
- teachers manage classes, weekly lessons, sick leave, tasks and communication
- parents get a calmer summary of child progress and attendance
- admins manage broadcasts, approvals, incidents and the full scheduling system
- kiosk screens display announcements and replacements

## Main Product Areas

### Student

- dashboard with grades, risks, recommendations and schedule preview
- full weekly schedule page
- profile page with achievements and portfolio-style stats
- homework page with upload / draft submission flow
- activity logging from UI actions

### Teacher

- split workspace instead of one overloaded page
- `Overview`
- `Schedule`
- `Classes`
- `Workbench`
- working actions for:
  - report generation
  - attendance follow-up
  - open lesson journal task
  - assign homework task
  - class communication task
  - support plan generation
  - sick leave request with automatic schedule reoptimization

### Parent

- calmer summary dashboard
- weekly family guidance
- progress / attendance / alerts summary

### Admin

- command center dashboard
- approval workflow
- incident resolution
- broadcasts
- announcements
- local demo data import
- weekly schedule management

### Kiosk

- school-wide info feed
- replacement cards
- admin-generated announcements

## Smart Schedule v1

The scheduling system is the most advanced module in the project.

### What it does

- builds a real weekly schedule for `Mon-Fri`
- supports a target of `5 lessons per day`
- respects:
  - teacher availability
  - room availability
  - class conflicts
  - teacher conflicts
  - room conflicts
  - pairs
  - academic hours
  - events
  - parallel `bands`
- stores draft and published weekly plans
- reoptimizes the published plan when a teacher goes on sick leave
- creates in-app notifications for affected classes and substitute teachers

### Important schedule entities

- `SchedulePlan`
- `ScheduleSlot`
- `ScheduleConflict`
- `Room`
- `TeacherAvailability`
- `RoomAvailability`
- `ScheduleRequirement`
- `ScheduleBand`
- `ScheduleBandMember`
- `TeacherAbsence`

### Key server files

- [lib/smart-schedule.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/smart-schedule.ts)
- [lib/schedule-quality.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/schedule-quality.ts)
- [lib/substitute-matcher.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/substitute-matcher.ts)
- [lib/server-data.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/server-data.ts)

## Routes and Pages

### Public / shared

- `/`
- `/login`
- `/news`
- `/leaderboard`
- `/settings`
- `/ai-assistant`
- `/kiosk`

### Student routes

- `/student`
- `/student/schedule`
- `/student/homework`
- `/student/profile`

### Teacher routes

- `/teacher`
- `/teacher/schedule`
- `/teacher/classes`
- `/teacher/workbench`

### Parent routes

- `/parent`

### Admin routes

- `/admin`
- `/admin/schedule`

## API Overview

### Auth and session

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/change-password`

### Common profile/settings

- `GET /api/me`
- `PATCH /api/me`
- `GET /api/me/settings`
- `PATCH /api/me/settings`

### Student API

- `GET /api/student/dashboard`
- `GET /api/student/profile`
- `POST /api/student/activity`
- `GET /api/student/resource-recommendations`
- `GET /api/student/topic-weakness`
- `POST /api/student/homework/submissions`

### Teacher API

- `GET /api/teacher/dashboard`
- `POST /api/teacher/reports`
- `POST /api/teacher/communications`
- `PATCH /api/teacher/tasks/[id]`
- `POST /api/teacher/absences`

### Parent API

- `GET /api/parent/dashboard`

### Admin API

- `GET /api/admin/dashboard`
- `GET /api/admin/broadcasts`
- `POST /api/admin/broadcasts`
- `PATCH /api/admin/approvals/[id]`
- `PATCH /api/admin/incidents/[id]`
- `POST /api/admin/migrate-local`

### Smart Schedule API

- `GET /api/admin/schedule`
- `POST /api/admin/schedule/generate`
- `POST /api/admin/schedule/publish`
- `GET /api/admin/schedule/constraints`
- `POST /api/admin/schedule/constraints`
- `POST /api/admin/schedule/absences`
- `GET /api/admin/schedule/quality`
- `GET /api/admin/schedule/substitutes`
- `POST /api/admin/schedule/substitutes`

### Content and demo data API

- `GET /api/news`
- `POST /api/news`
- `GET /api/leaderboard`
- `GET /api/kiosk`
- `GET /api/mock/bilimclass`
- `GET /api/mock/bilimclass/classes`
- `GET /api/mock/bilimclass/students`
- `GET /api/mock/bilimclass/students/[studentId]`
- `GET /api/mock/bilimclass/students/[studentId]/grades`
- `GET /api/mock/bilimclass/students/[studentId]/attendance`

## Folder Map

### App routes

- [app/(dashboard)/student/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/student/page.tsx)
- [app/(dashboard)/student/schedule/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/student/schedule/page.tsx)
- [app/(dashboard)/student/homework/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/student/homework/page.tsx)
- [app/(dashboard)/student/profile/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/student/profile/page.tsx)
- [app/(dashboard)/teacher/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/teacher/page.tsx)
- [app/(dashboard)/teacher/schedule/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/teacher/schedule/page.tsx)
- [app/(dashboard)/teacher/classes/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/teacher/classes/page.tsx)
- [app/(dashboard)/teacher/workbench/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/teacher/workbench/page.tsx)
- [app/(dashboard)/parent/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/parent/page.tsx)
- [app/(dashboard)/admin/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/admin/page.tsx)
- [app/(dashboard)/admin/schedule/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/admin/schedule/page.tsx)
- [app/kiosk/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/kiosk/page.tsx)

### Shared UI

- [components/DashboardShell.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/components/DashboardShell.tsx)

### Domain and data assembly

- [lib/server-data.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/server-data.ts)
- [lib/session.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/session.ts)
- [lib/http.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/http.ts)
- [lib/smart-schedule.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/smart-schedule.ts)
- [lib/schedule-constants.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/schedule-constants.ts)
- [lib/schedule-quality.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/schedule-quality.ts)
- [lib/substitute-matcher.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/substitute-matcher.ts)
- [lib/topic-weakness.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/topic-weakness.ts)
- [lib/resource-recommender.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/resource-recommender.ts)
- [lib/mock-bilimclass.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/mock-bilimclass.ts)

### Database

- [prisma/schema.prisma](/Users/kaliakbar/Desktop/aqbobek-hub/prisma/schema.prisma)
- [prisma/seed.ts](/Users/kaliakbar/Desktop/aqbobek-hub/prisma/seed.ts)

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Prepare database

Fresh reset:

```bash
npx prisma migrate reset --force
npm run db:seed
```

If you only need to reseed current DB:

```bash
npm run db:seed
```

### 3. Start app

```bash
npm run dev
```

Then open:

- [http://localhost:3000](http://localhost:3000)
- [http://localhost:3000/kiosk](http://localhost:3000/kiosk)

## Environment

The app uses:

- local SQLite database at [dev.db](/Users/kaliakbar/Desktop/aqbobek-hub/dev.db)
- optional `GEMINI_API_KEY` for the AI assistant

If `GEMINI_API_KEY` is present, `/api/ai-assistant` can answer with the Google model configured in [app/api/ai-assistant/route.ts](/Users/kaliakbar/Desktop/aqbobek-hub/app/api/ai-assistant/route.ts).

## Demo Accounts

Password for visible demo users:

- `12345`

### Students

- `student1`
- `student2`
- `student3`

### Teachers

- `teacher1`
- `teacher2`
- `teacher3`
- `teacher4`
- `teacher5`
- `teacher6`
- `teacher7`
- `teacher8`

### Parents

- `parent1`
- `parent2`
- `parent3`

### Admin

- `admin`

### Seed-only extra students

The seed also creates hidden background students to make class sizes and leaderboard density more realistic:

- `20 extra students` per class in `10 А`, `10 Б`, `10 В`
- these hidden students are not intended for demo login
- they use a separate seed-only password and exist mainly for leaderboard, analytics and class realism

## What the Seed Creates

The seed builds a connected demo school world:

- 3 school classes:
  - `10 А`
  - `10 Б`
  - `10 В`
- core subjects
- 3 visible students
- 60 hidden background students
- 8 teachers
- 3 parents
- 1 admin
- grades
- attendance
- student goals
- achievements
- badges
- activity feed entries
- risk alerts
- leaderboard entries
- teacher tasks
- homework assignments and submissions
- news items
- broadcasts
- kiosk items
- approvals
- incidents
- event log
- weekly scheduling constraints
- generated weekly schedule

## How the Roles Are Connected

### Student

Student pages and APIs are fed through [lib/server-data.ts](/Users/kaliakbar/Desktop/aqbobek-hub/lib/server-data.ts) and read:

- grades
- risk alerts
- leaderboard placement
- weekly schedule
- homework assignments/submissions
- achievements and badges
- personalized study recommendations

### Teacher

Teacher pages now use one backend payload and are split into focused screens:

- `Overview` for priorities and next lesson
- `Schedule` for the weekly timetable
- `Classes` for class summaries and risk students
- `Workbench` for tasks, broadcasts and sick leave

Teacher action buttons are wired to:

- `TeacherTask`
- `EventLog`
- `TeacherAbsence`
- schedule reoptimization flow

### Parent

Parent pages summarize:

- child performance
- attendance
- alerts
- family guidance

### Admin

Admin screens work with:

- `Approval`
- `Incident`
- `Broadcast`
- `NewsItem`
- `EventLog`
- full schedule management endpoints

## Homework Upload Flow

Student homework is handled through:

- [app/(dashboard)/student/homework/page.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/student/homework/page.tsx)
- [app/(dashboard)/student/homework/StudentHomeworkView.tsx](/Users/kaliakbar/Desktop/aqbobek-hub/app/(dashboard)/student/homework/StudentHomeworkView.tsx)
- [app/api/student/homework/submissions/route.ts](/Users/kaliakbar/Desktop/aqbobek-hub/app/api/student/homework/submissions/route.ts)

Uploads are stored under:

- [public/uploads/homework](/Users/kaliakbar/Desktop/aqbobek-hub/public/uploads/homework)

If a student sends only a note, the system saves a draft submission without a file.

## Teacher Workbench Actions

Current teacher actions are task-driven and visible on the dashboard after refresh.

Implemented actions include:

- generate diagnostic test
- create support plan
- notify parents
- request attendance report
- open journal task for a lesson
- mark attendance task for a lesson
- assign homework task
- prepare class message
- review student plan
- mark task done / reopen task
- request sick leave

## Verified Smoke Checks

The following were manually rechecked after the latest fixes:

### Pages

- `/student`
- `/student/schedule`
- `/student/homework`
- `/student/profile`
- `/teacher`
- `/teacher/schedule`
- `/teacher/classes`
- `/teacher/workbench`
- `/parent`
- `/admin`
- `/admin/schedule`
- `/news`
- `/leaderboard`
- `/settings`
- `/ai-assistant`
- `/kiosk`

### Working actions

- student activity logging
- student homework draft submission
- AI assistant history load and clear
- profile update
- settings update
- password change
- teacher report generation
- teacher communications actions
- teacher task toggle
- teacher sick leave request
- admin broadcast creation
- admin news publication
- admin approval update
- admin incident resolution
- admin local data import
- admin schedule generation
- admin schedule publish
- admin schedule constraints save
- admin-triggered sick leave reoptimization

### Production checks

```bash
npm run lint
npm run build
```

Both pass.

## Bugs Fixed During Final Audit

Two real backend issues were fixed during the final pass:

### 1. Constraint save round-trip

Problem:

- `GET /api/admin/schedule/constraints` followed by `POST /api/admin/schedule/constraints` could fail with foreign key errors

Cause:

- rooms and bands were recreated with new IDs
- related room availability, band members and requirements still referenced old IDs

Fix:

- IDs are now preserved for recreated rooms, bands, band members and requirements
- constraint saving is now idempotent for normal admin round-trips

### 2. Sick leave reoptimization timeout

Problem:

- teacher or admin sick leave requests could fail with an expired interactive transaction

Cause:

- the plan creation path inside reoptimization was holding the transaction open incorrectly

Fix:

- plan persistence now accepts a transaction client
- reoptimized published plan creation uses the same transaction correctly
- transaction timeout was raised for the heavy scheduling flows

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:reset
```

## Known Notes

- The AI assistant depends on `GEMINI_API_KEY`.
- The project still shows two non-blocking framework warnings during build:
  - Next.js workspace root inference because multiple lockfiles exist on the machine
  - `middleware.ts` deprecation warning in favor of `proxy`
- Push notifications in this project are `in-app push`, not browser push.
- Teacher lesson journal actions are task-backed right now; a fully persisted lesson journal module can still be built as a next step.

## Suggested Next Steps

- build a full persisted lesson journal with attendance, lesson topic, homework and teacher notes
- add teacher-side homework review with feedback and grading
- improve mobile layout of timetable pages
- replace the current JSON-like schedule constraints editing with a richer matrix UI
- add stronger parent navigation with separate progress and attendance pages
