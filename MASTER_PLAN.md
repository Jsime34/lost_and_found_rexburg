# Rexburg Lost & Found: Master Plan

An app that helps people in Rexburg, Idaho find their lost items. It lists every lost & found
location on campus. Admins log each found item with its characteristics (color, brand, type,
photos), and users run a filtered search to see which lost & found has their item.

For example, if someone lost a blue Hydro Flask water bottle, the admin enters *blue*,
*Hydro Flask* and *water bottle*. The user searches with those same filters and sees which desk
has it and how long it has been there.

**Team:** Evan (Jared Evan Jenson) · Trevor Beckstrand · Braden Griffiths · Jaime Gutierrez Zevallos

**Status:** Planning. No code yet.

---

## For AI coding agents: read this first

If you are an AI agent working for one of the team members:

1. **Ask your human which team member they are** (Evan, Trevor, Braden or Jaime). Don't guess from
   git usernames.
2. Read **§0 Current state**, then **your person's section in §R Roles**.
3. Work on the **first unchecked task** in your person's section, unless your human picks another.
4. **Only edit files your person owns** (listed in their section). For anything under
   "Shared, ask first", get your human's OK and have them tell the team before merging.
5. Tasks marked **(human)** need a real person (meetings, emails, GitHub settings). Remind your
   human about them; don't try to do them yourself.
6. Follow the stack in §1 and the contract in `docs/API.md` (once it exists). If something there
   seems wrong, tell your human instead of working around it.
7. Don't start weeks 2–4 feature work until the week 1 foundation for it is merged on `main`.
8. When you finish a task, tick its checkbox (`[ ]` → `[x]`) in this file **in the same pull
   request**. Only tick your own person's boxes.

---

## 0. Current state (as of Wed Sep 23, 2026)

- The repo has only three files:
  - `README.md`: title and Evan's name
  - `compiler.json`: empty; added in commit `782acfd` ("stertin"); no purpose written down yet
  - `MASTER_PLAN.md`: this file
- No code, no `docs/API.md`, no CI, and no branch protection yet.
- The stack in §1 is a **recommendation**. The team hasn't confirmed it.
- **Next milestones:**
  - design session (data model + endpoints) by **Fri Sep 26**
  - project skeleton merged on **Mon Sep 28**

---

## §R. Roles

| Person | Setup role (weeks 0–1) | Feature workstream (weeks 2–4 and on) |
|---|---|---|
| **Evan** | Tooling lead: project skeleton, shared types, CI | **WS1** Search & browse |
| **Trevor** | Backend & database lead: server core, schema, seed data | **WS2** Admin items & photos |
| **Braden** | Frontend lead: client shell, pages, UI kit | **WS3** Locations, map & time counter, plus deployment in week 8 |
| **Jaime** | Coordinator & repo admin: GitHub, `docs/API.md`, auth | **WS4** Claims & pickups |

**Dependency order for week 1:**
1. Evan's skeleton (Mon)
2. Then, at the same time: Trevor's server core + database, Braden's client shell, Evan's shared types + CI
3. Jaime's auth merges right after Trevor's server core
4. By Fri, everyone runs the app and can log in

### Evan: tooling lead + WS1 Search & browse

**Owns:**
- Repo root config: `package.json` (workspaces), `tsconfig.base.json`, `.gitignore`, `.editorconfig`, Prettier config, `.github/workflows/ci.yml`
- `shared/`: enums, request/response types, zod schemas
- WS1:
  - `server/src/modules/items/items.public.routes.ts`
  - `client/src/features/search/`
  - `server/test/items.search.test.ts`

**Shared, ask first:** anything in `server/src/db/`, `client/src/components/`, or other people's folders.

**Week 0 (now → Fri Sep 26)**
- [ ] (human) Bring the stack in §1 to the team and confirm it, or switch to the course's required stack. Write the decision in §1.
- [ ] (human) Ask who added `compiler.json` and what it's for. Keep it with a note, or delete it in the skeleton PR.
- [ ] Fill in the **WS1** section of `docs/API.md` once Jaime creates it: search query parameters and response shape.

**Week 1 (Mon Sep 28 →)**
- [ ] **Day 1, first thing (everyone is waiting on this):** skeleton PR.
  - npm workspaces `shared/`, `server/`, `client/`
  - TypeScript config and Prettier
  - `.gitignore` covering `node_modules`, `.env`, database files, `uploads/`
  - root `npm run dev` / `npm test` / `npm run typecheck` scripts
  - Keep it small so it merges the same day.
- [ ] `shared/`: enums (categories, colors, item and claim statuses) and the types + zod schemas from `docs/API.md`.
- [ ] CI workflow: install, typecheck, test and build on every pull request. Then tell Jaime to require it on `main`.

**Weeks 2–4 (WS1)**
- [ ] `GET /api/items`
  - filters: `q`, `category`, `color`, `brand`, `locationId`, `status`, date range
  - sort (newest/oldest) and paging
  - tests
- [ ] `GET /api/items/:id`: hidden details and pending request count only for admins. Tests.
- [ ] `/search` page
  - filter sidebar and results grid
  - filters kept in the URL so searches can be shared
  - loading, empty and error states
- [ ] `/items/:id` page
  - photos, `TimeCounter` (from Braden) and location card
  - "Request this item" button linking to `/items/:id/claim` (Jaime's page)

**Others wait on you for:** the skeleton (day 1), then the `shared/` types.
**You wait on:** Trevor's seed data, and Braden's UI kit + `TimeCounter`.

### Trevor: backend & database lead + WS2 Admin items & photos

**Owns:**
- Server core: `server/src/app.ts`, `server/src/config.ts`, the error handler, the validation helper
- `server/src/db/`: migrations, migration runner, seed data, `db:reset` script
- WS2:
  - `server/src/modules/items/items.admin.routes.ts`
  - photo upload handling
  - `client/src/features/admin-items/`
  - `server/test/items.admin.test.ts`

**Shared, ask first:** `shared/` (Evan), auth files (Jaime), `client/src/components/` (Braden).

**Week 0 (now → Fri Sep 26)**
- [ ] Turn the data model in §2 into a draft table list (columns + types) and bring it to the design session.
- [ ] Fill in the **WS2** section of `docs/API.md`.

**Week 1 (after Evan's skeleton merges)**
- [ ] Express server core
  - JSON body parsing
  - errors always shaped `{ "error": { "message": "..." } }`
  - validation helper and `GET /api/health`
- [ ] Database
  - `001_init.sql` migration and a runner that applies new migrations on startup
  - test helper that gives each test file a fresh in-memory database
- [ ] Seed data
  - 5–6 Rexburg locations, marked DEMO until Braden confirms the real ones
  - 2 demo accounts (admin + student)
  - ~15 items, 1 pending request, 1 completed pickup
  - Post the demo logins in team chat.

**Weeks 2–4 (WS2)**
- [ ] Create / edit / delete item endpoints (admin only), with tests.
- [ ] Photo upload: up to 6 per item; jpg/png/webp only; 5 MB max each. Plus photo delete. Tests.
- [ ] `/admin/items` table: every status, quick status change, delete.
- [ ] `/admin/items/new` and `/admin/items/:id/edit` form with photo uploader. The hidden details field is clearly labeled "Only staff can see this".

**Others wait on you for:**
- server core + `users` table (Jaime's auth, early week 1)
- seed data (everyone, end of week 1)

**You wait on:** Evan's skeleton, Jaime's `requireAdmin`.

### Braden: frontend lead + WS3 Locations, map & time counter + deployment

**Owns:**
- Client shell: Vite + React app, router, layout/nav, `client/src/components/ui/`, API fetch helper
- The shared `TimeCounter` component
- WS3:
  - `server/src/modules/locations/`
  - `client/src/features/locations/`
  - `server/test/locations.test.ts`
- Deployment (week 8)

**Shared, ask first:** `shared/` (Evan), `server/src/db/` (Trevor), auth files (Jaime).

**Week 0 (now → Fri Sep 26)**
- [ ] (human) Find the real lost & found desks: which buildings run one, their hours, and how long they keep items. Start with the Manwaring Center information desk. Write the results in `docs/locations.md` for Trevor's seed data.
- [ ] Fill in the **WS3** section of `docs/API.md`.

**Week 1 (after Evan's skeleton merges)**
- [ ] Client shell: Vite + React + React Router + Tailwind, with the dev server proxying `/api` to the API server.
- [ ] Register **every** page as a placeholder route so nobody edits the router later:
  - public: `/`, `/search`, `/items/:id`, `/map`, `/locations/:id`, `/login`, `/register`
  - logged in: `/items/:id/claim`, `/me/claims`
  - admin: `/admin/items`, `/admin/items/new`, `/admin/items/:id/edit`, `/admin/items/:id/release`, `/admin/claims`, `/admin/pickups`, `/admin/locations`
- [ ] UI kit: Button, Input, Select, Textarea, Card, Badge, Spinner, EmptyState, ErrorMessage, PageHeader.
- [ ] Layout with nav (Search, Map, My requests, Admin) that works at phone width.

**Weeks 2–4 (WS3)**
- [ ] **Early week 2, Evan needs it:** `TimeCounter`, e.g. "In lost & found for 3 days · 27 days left before donation".
- [ ] Locations endpoints, with tests
  - list (with the number of items at each location) and get one
  - admin create / edit / delete; delete is refused while items are still there
- [ ] `/map`: Leaflet + OpenStreetMap, a marker per desk with its item count, and a list beside the map.
- [ ] `/locations/:id`: hours, address, directions link, and "Browse items here" linking to `/search?locationId=…`.
- [ ] `/admin/locations`: form, where clicking the map sets the coordinates.
- [ ] When WS3 is done, pair with Jaime on WS4.

**Others wait on you for:**
- client shell + UI kit (everyone, end of week 1)
- `TimeCounter` (Evan, early week 2)

**You wait on:** Evan's skeleton, Trevor's seed data.

### Jaime: coordinator & repo admin + auth + WS4 Claims & pickups

**Owns:**
- GitHub repo settings (Jaime owns the repo), `docs/API.md` (keeps it consistent), and this plan
- Auth:
  - `server/src/modules/auth/`
  - `requireAuth` / `requireAdmin` middleware
  - client auth context, login/register pages, route guards
- WS4:
  - `server/src/modules/claims/`
  - `client/src/features/claims/`
  - `server/test/claims.test.ts`

**Shared, ask first:** `shared/` (Evan), `server/src/db/` (Trevor), `client/src/components/` (Braden).

**Week 0 (now → Fri Sep 26)**
- [ ] Push `MASTER_PLAN.md` to GitHub (it's committed locally, not pushed yet).
- [ ] **Today, others need it:** create a `docs/API.md` skeleton with one empty section each for Auth, WS1, WS2, WS3 and WS4. Each owner then fills in their own section without merge conflicts.
- [ ] (human) Make sure all 4 have write access. Protect `main`: require a pull request with 1 approval. Add "CI must pass" once Evan's CI exists.
- [ ] (human) Schedule and run the 1-hour design session before Fri Sep 26. Goal: agree on §2 and every endpoint in `docs/API.md`.
- [ ] Fill in the **Auth** and **WS4** sections of `docs/API.md`.

**Week 1 (after Trevor's server core merges)**
- [ ] Auth endpoints, with tests
  - register, login, logout, me
  - bcrypt password hashing; session in an httpOnly cookie
  - `requireAuth` and `requireAdmin` middleware
- [ ] `make-admin` script that promotes an existing account to admin.
- [ ] Client: auth context, `/login` and `/register` pages, guards for logged-in and admin-only pages.

**Weeks 2–4 (WS4)**
- [ ] Request an item, with tests.
  - includes "for a friend" (friend's name + contact)
  - the item becomes `claim_pending`
  - blocks duplicate requests
- [ ] `/me/claims`: my requests, with cancel.
- [ ] `/admin/claims` review queue: approve/reject with a note. The item's hidden details show next to the claimant's description.
- [ ] `/admin/items/:id/release`: record the pickup.
  - who picked it up, last 4 of their ID, notes, and which admin released it
  - item → `picked_up`, claim → `completed`
- [ ] `/admin/pickups`: pickup log, admin only.

**Others wait on you for:**
- `docs/API.md` skeleton (everyone, today)
- `requireAdmin` + route guards (Trevor and Braden, end of week 1)

**You wait on:** Trevor's server core + seed data, Braden's client shell.

---

## Problem

Many people can't find their items after losing them, and a lost & found can't easily prove
who took an item home. This app:

- helps people find lost items quickly
- helps stop theft from the lost & found by recording who picks each item up

## Features (first version)

| # | Feature | Owner |
|---|---|---|
| 1 | Search and filter by type, color, brand and location | WS1 (Evan) |
| 2 | Admins can add and remove items | WS2 (Trevor) |
| 3 | Time counter: how long an item has been in the lost & found, and days left before it's donated | WS3 (Braden) |
| 4 | Map of lost & found locations | WS3 (Braden) |
| 5 | Request an item for a friend | WS4 (Jaime) |
| 6 | Record of who picked the item up | WS4 (Jaime) |
| 7 | Post pictures of items | WS2 (Trevor) |

**Theft control:** admins enter hidden details that the public never sees, like a serial number or a
name written inside. Anyone requesting an item has to describe it, and staff compare the two. Each
pickup records the person's name, the last 4 characters of their ID, and which admin released it.

---

## 1. Recommended stack

**Not confirmed yet.** Evan brings this to the team in week 0. If the course requires a different
stack, use that instead and update this table.

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript everywhere | One language for the whole team, with shared types between website and server |
| Website | React + Vite, mobile-friendly | One codebase that also works on phones |
| Server | Node + Express | Simple and well documented |
| Database | SQLite (Postgres later if needed) | A single file with nothing to install |
| Validation | Zod, shared by website and server | Both sides check input with the same rules |
| Map | Leaflet + OpenStreetMap | Free, no API key |
| Styling | Tailwind CSS | Four people aren't all editing one CSS file |
| Tests / CI | Vitest + GitHub Actions | Tests run automatically on every pull request |

## 2. Data model

- **users**: name, email, password hash, role (`user` or `admin`)
- **locations**: name, building, latitude/longitude, hours, how many days items are held
- **items**: title, category, color, brand, description, hidden details, where found, when found, location, status
- **item_photos**: photos attached to an item
- **claims**: item, requester, for a friend (yes/no), friend's name and contact, message, status
- **pickups**: item, claim, who picked it up, last 4 of their ID, admin who released it, time

**Item status:** `available → claim_pending → picked_up`, or `disposed` once the hold period ends.
**Claim status:** `pending → approved → completed`, or `rejected` / `cancelled`.

## 3. Workstreams

Each person owns their feature's server code, pages and tests from start to finish. See §R for
the detailed task lists.

| Workstream | Server endpoints | Pages |
|---|---|---|
| **WS1 Search & browse** (Evan) | `GET /api/items` (filters, text search, sort, paging), `GET /api/items/:id` | Search page (filters kept in the URL so searches can be shared), item page (photos, time counter, location, "Request" button) |
| **WS2 Admin items & photos** (Trevor) | `POST` / `PATCH` / `DELETE /api/items`, upload and delete photos | Admin item table, add/edit form with photo uploader |
| **WS3 Locations, map & time counter** (Braden) | Add/edit/delete locations, with item counts | Map page, location page, admin locations page, the shared time counter. Also leads deployment. |
| **WS4 Claims & pickups** (Jaime) | Create a request (including for a friend), my requests, cancel, approve/reject, record a pickup, pickup log | Request form, "My requests", admin review list (hidden details shown next to the request), release form, pickup log |

WS4 has the most work, so Braden joins Jaime once WS3 is done.

## 4. Working in parallel without collisions

1. **Agree on the design first.** In one session, agree on the data model and every endpoint's
   input and output, and write them down in `docs/API.md`. Later changes go through a small pull
   request that everyone sees.
2. **Each person owns their own folders** (listed in §R). Shared files (database design, login,
   page layout, the list of pages, shared UI pieces) need a heads-up in team chat and a review
   from another person.
3. **Add every page as an empty placeholder in week 1** (Braden), so nobody has to edit the
   shared list of pages later.
4. **Share realistic demo data** (Trevor). About 15 items, a pending request and a completed
   pickup, so Evan and Jaime don't have to wait for the admin form.
5. **Link to each other's pages instead of reusing each other's code.** For example, the item page
   links to `/items/:id/claim` instead of importing WS4 code.
6. **One person adds a package at a time, in its own pull request**, to avoid lock-file conflicts.
   Never edit a database migration after it's merged. Add a new one instead.

## 5. Timeline

Assumes a final demo the week of Nov 30, 2026. Adjust the dates to the course calendar.

| Week | Dates | Goal | Done when |
|---|---|---|---|
| 0 | Sep 23–26 | Settle the stack (Evan). `docs/API.md` skeleton, then a 1-hour session to agree on the data model and endpoints (Jaime). Find the real lost & found desks (Braden). | Endpoints doc merged |
| 1 | Sep 28 | Project setup, split four ways: **Evan** skeleton, shared types, CI · **Trevor** server core, database, demo data · **Braden** client shell, pages, UI kit · **Jaime** sign-up, login, admin role | Everyone runs the app and can log in, and CI passes |
| 2–4 | Oct 5–23 | Core features, all four workstreams at once | Each workstream's endpoints and pages work with demo data and have tests |
| 5 | Oct 26 | **Full-flow check:** admin adds an item with a photo → student finds it → requests it for a friend → admin approves → friend picks it up → it shows in the log | Full flow works on `main` |
| 6 | Nov 2 | Make it solid: phone layout, empty and error messages, accessibility, real location data | Known bugs listed and being worked |
| 7 | Nov 9 | One optional extra per workstream | |
| 8 | Nov 16 | Put it online (Braden; Render, Railway or Fly, with persistent storage). Test with 3–5 students. | Public URL |
| 9 | Nov 23 | Fix the top feedback (short week, Thanksgiving) | |
| 10 | Nov 30 | Feature freeze 48 hours before the demo, rehearse it | Final demo |

**Weekly routine:** short written check-ins Mon/Wed/Fri (done / next / blocked), one 30-minute
call a week to try `main` together, and pull request reviews within 24 hours.

## 6. Git workflow

- `main` should always run. Once coding starts (week 1), every change goes through a pull request
  with 1 approval and passing tests.
- Branch names: `ws1/filter-by-date`, `ws3/map-markers`, `core/add-photos-table`.
- Keep pull requests small. Write commit messages in the imperative ("Add brand filter").
- Never commit `.env` files, the local database, or uploaded photos.

**A feature is done when:**

- it works on a computer and at phone width
- it shows loading, empty and error messages
- its endpoints have tests, including not-logged-in and bad-input cases
- type checks and tests pass
- `docs/API.md` is updated if anything changed
- another team member has reviewed it
- its checkbox in §R is ticked

## 7. Risks

| Risk | What to do about it |
|---|---|
| Someone requests an item just because they saw its photo | Hidden details, a description check, and the last 4 of their ID at pickup |
| Privacy of pickup records | Admins only. Store only the last 4 of an ID. Don't photograph what's inside wallets or ID cards. |
| Wrong location data | Braden confirms with each building in weeks 0–2 |
| The host deletes the database file on restart | Use persistent storage, or switch to Postgres |
| Uneven workload | Braden helps Jaime after WS3 is done |

## 8. Optional extras (week 7+)

- **Evan (WS1):** saved searches with email alerts when a match is turned in
- **Trevor (WS2):** bulk-dispose items past their hold period, shrink photos on upload
- **Braden (WS3):** "open now" badges on locations
- **Jaime (WS4):** email when a request is approved
