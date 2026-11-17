# UniQue: University Club & Event Management System

Project 01 by **Team Orbital Strike**. This is a centralised university platform where students discover clubs, register for events and receive announcements. Club representatives and administrators manage everything from their own dashboards.

Built with **Next.js 16 (App Router, Server Actions)**, **Tailwind CSS 4**, **Prisma** and **SQLite**.

## Quick start

```bash
npm install
cp .env.example .env      # skip if .env already exists
npm run setup             # creates the database and loads demo data
npm run dev               # http://localhost:3070
```

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@unique.edu | Admin@123 |
| Club representative (Computer & Programming Club) | rep@unique.edu | Rep@12345 |
| Student | student@unique.edu | Student@123 |

All other seeded users use `Password@123`. The login page has one-click demo buttons while `DEMO_MODE="true"`.

Run `npm run db:reset` at any time to restore the demo data. Event dates are generated relative to today, so there are always upcoming and past events.

## What's implemented (mapped to the outline)

### Public website
| Route | Features |
| --- | --- |
| `/` | Hero banner, welcome text, live stats, featured clubs, upcoming events, latest announcements, footer |
| `/clubs` | Search, category filter, sort, club cards with logo, description and member count, pagination |
| `/clubs/:id` | Cover, logo, description, objectives, representative info, stats, members, upcoming and past events, club notices, join/leave button |
| `/events` | Upcoming and past tabs, search, category and club filters, event cards with date, venue, seats left and a register button |
| `/events/:id` | Banner, description, date, time, venue, organiser, registration deadline, capacity bar, register/cancel |
| `/announcements` | University and club notices, category labels, search, pinned notices, pagination |
| `/about` | About Us page |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Authentication |

### Student dashboard (`/student/*`)
Overview (welcome, stats, upcoming events, my clubs, suggestions, announcements) · My Clubs (membership status, leave/withdraw, **propose a new club**) · My Registrations (cancel) · Event History (participation status) · Announcements (university + joined clubs) · Notifications · My Profile (picture upload, edit, change password).

### Club representative dashboard (`/club/*`)
Overview (stats, upcoming events, quick approve of membership requests, recent registrations) · Club Profile (logo, cover, info, objectives) · Members (approve/decline, positions, remove) · Create Event (date and time pickers, deadline, capacity, members-only, banner upload, publish or save as draft) · Manage Events (edit, publish, cancel, delete) · Registrations (per event, attendance marking, cancel/restore, **CSV export**) · Announcements · Reports (registration, membership and participation charts) · Notifications.

### Administrator dashboard (`/admin/*`)
Overview (total clubs, students, events and registrations, registration chart, attendance, pending club approvals, newest accounts) · Club Management (approve/reject with reason, suspend, reactivate, feature, add/edit/delete) · User Management (add, change role, suspend, delete) · Event Management (feature, cancel, restore, delete) · Representative Management (assign/unassign reps to clubs) · Announcements (university-wide, pinning, moderate club notices) · Analytics & Reports · Notifications · Settings (profile, password, system preferences).

### Rules worth knowing
- **Roles:** `STUDENT`, `REP`, `ADMIN`. A representative is still a student, so they can open the student dashboard and join clubs or register for events. Every server action re-checks the role.
- **Club proposals:** when an admin approves a student's proposal, that student becomes the club's representative (and its President).
- **One club per representative.** Assigning a new rep to a club returns the previous rep to a student account.
- **Membership approval** can be switched off in Settings, so students join instantly.
- **Registration** is blocked after the deadline, when the event is full, or for members-only events if the student isn't an approved member.
- **Attendance** can be marked once an event has started, and it feeds Event History and the reports.
- **Notifications** are in-app (membership decisions, new events in joined clubs, cancellations, announcements, role changes).
- **Times** are entered and displayed in Bangladesh time (GMT+6).

## Project structure

```
prisma/schema.prisma      Users, Clubs, Memberships, Events, Registrations, Announcements, Notifications (+ Sessions, PasswordResets, Settings)
prisma/seed.ts            Demo data
src/app/(public)          Public website
src/app/(auth)            Login, registration, password reset
src/app/student|club|admin  The three dashboards
src/app/actions           Server actions (auth, student, club, admin)
src/app/api/uploads       Serves uploaded images from ./uploads
src/components            Shared UI (cards, charts, forms, modals, toasts, dashboard shell…)
src/lib                   DB client, auth/session, settings, uploads, notifications, helpers
```

## Deployment (Docker)

Live at **https://uniclub.onespotsolution.online**. The app runs in Docker on the VPS, behind nginx and Cloudflare.

- Project folder on the server: `/root/uniclub` (a clone of this repo). The SQLite database is in `data/` and uploads are in `uploads/`. Both are mounted volumes and survive rebuilds.
- The server's `.env` holds `DEMO_MODE="false"`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` and the `SEED_*_PASSWORD` values.
- The nginx site config is in `deploy/nginx-uniclub.conf`. The certificate comes from Let's Encrypt (certbot).

**Deploy an update:** push to `main`, then on the server run:

```bash
cd /root/uniclub && sh scripts/deploy.sh
```

**Reload the demo data on the server. This wipes everything:**

```bash
docker compose exec -e SEED_CONFIRM=yes app npx tsx prisma/seed.ts
```

## Notes and next steps
- **Email:** no email service is configured, matching the outline, where automated email is a future enhancement. In demo mode the forgot-password page shows the reset link directly, and the link is also printed in the server log. Set `DEMO_MODE="false"` to hide the link and the demo-login buttons.
- **Database:** SQLite keeps setup zero-config. To use PostgreSQL, change `provider` in `schema.prisma` and `DATABASE_URL`, then run `npx prisma db push`.
- **Uploads** are stored in `./uploads`. Use persistent storage, such as a volume or S3, when deploying.
- **Sessions** are opaque random tokens (only their SHA-256 hash is stored) in an httpOnly cookie, and passwords are hashed with bcrypt.
