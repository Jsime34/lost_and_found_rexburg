# Rexburg Lost & Found: Master Plan

An app that helps people in Rexburg, Idaho find their lost items. It lists every lost & found
location on campus. Admins log each found item with its characteristics (color, brand, type,
photos), and users run a filtered search to see which lost & found has their item.

For example, if someone lost a blue Hydro Flask water bottle, the admin enters *blue*,
*Hydro Flask* and *water bottle*. The user searches with those same filters and sees which desk
has it and how long it has been there.

**Team:** Jared Evan Jenson · Trevor Beckstrand · Braden Griffiths · Jaime Gutierrez Zevallos

**Status:** Planning. No code yet.

---

## Problem

Many people can't find their items after losing them, and a lost & found can't easily prove
who took an item home. This app:

- helps people find lost items quickly
- helps stop theft from the lost & found by recording who picks each item up

## Features (first version)

| # | Feature | Owner |
|---|---|---|
| 1 | Search and filter by type, color, brand and location | WS1 |
| 2 | Admins can add and remove items | WS2 |
| 3 | Time counter: how long an item has been in the lost & found, and days left before it's donated | WS3 |
| 4 | Map of lost & found locations | WS3 |
| 5 | Request an item for a friend | WS4 |
| 6 | Record of who picked the item up | WS4 |
| 7 | Post pictures of items | WS2 |

**Theft control:** admins enter hidden details that the public never sees, like a serial number or a
name written inside. Anyone requesting an item has to describe it, and staff compare the two. Each
pickup records the person's name, the last 4 characters of their ID, and which admin released it.

---

## 1. Recommended stack

Confirm this in week 0. If the course requires a different stack, use that instead.

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

Each person owns their feature's server code, pages and tests from start to finish. Owners are
suggestions; swap freely.

| Workstream | Server endpoints | Pages |
|---|---|---|
| **WS1 Search & browse** (Jared) | `GET /api/items` (filters, text search, sort, paging), `GET /api/items/:id` | Search page (filters kept in the URL so searches can be shared), item page (photos, time counter, location, "Request" button) |
| **WS2 Admin items & photos** (Trevor) | `POST` / `PATCH` / `DELETE /api/items`, upload and delete photos | Admin item table, add/edit form with photo uploader |
| **WS3 Locations, map & time counter** (Braden) | Add/edit/delete locations, with item counts | Map page, location page, admin locations page, the shared time counter. Also leads deployment. |
| **WS4 Claims & pickups** (Jaime) | Create a request (including for a friend), my requests, cancel, approve/reject, record a pickup, pickup log | Request form, "My requests", admin review list (hidden details shown next to the request), release form, pickup log |

WS4 has the most work, so WS3 joins WS4 once the map is done.

## 4. Working in parallel without collisions

1. **Agree on the design first.** In one session, agree on the data model and every endpoint's
   input and output, and write them down in `docs/API.md`. Later changes go through a small pull
   request that everyone sees.
2. **Each person owns their own folders.** Shared files (database design, login, page layout, the
   list of pages, shared UI pieces) need a heads-up in team chat and a review from another workstream.
3. **Add every page as an empty placeholder in week 1**, so nobody has to edit the shared list of
   pages later.
4. **Share realistic demo data.** About 15 items, a pending request and a completed pickup, so
   WS1 and WS4 don't have to wait for WS2's admin form.
5. **Link to each other's pages instead of reusing each other's code.** For example, the item page
   links to `/items/:id/claim` instead of importing WS4 code.
6. **One person adds a package at a time, in its own pull request**, to avoid lock-file conflicts.
   Never edit a database migration after it's merged. Add a new one instead.

## 5. Timeline

Assumes a final demo the week of Nov 30, 2026. Adjust the dates to the course calendar.

| Week | Dates | Goal | Done when |
|---|---|---|---|
| 0 | Sep 23–26 | Settle the stack. 1-hour session to agree on the data model and endpoints. Ask campus which buildings run a lost & found desk. | Endpoints doc merged |
| 1 | Sep 28 | Project setup, split four ways: **Jared** repo, tooling, CI · **Trevor** database tables and demo data · **Braden** page layout, navigation, shared UI · **Jaime** sign-up, login, admin role | Everyone runs the app and can log in, and CI passes |
| 2–4 | Oct 5–23 | Core features, all four workstreams at once | Each workstream's endpoints and pages work with demo data and have tests |
| 5 | Oct 26 | **Full-flow check:** admin adds an item with a photo → student finds it → requests it for a friend → admin approves → friend picks it up → it shows in the log | Full flow works on `main` |
| 6 | Nov 2 | Make it solid: phone layout, empty and error messages, accessibility, real location data | Known bugs listed and being worked |
| 7 | Nov 9 | One optional extra per workstream | |
| 8 | Nov 16 | Put it online (Render, Railway or Fly, with persistent storage). Test with 3–5 students. | Public URL |
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

## 7. Risks

| Risk | What to do about it |
|---|---|
| Someone requests an item just because they saw its photo | Hidden details, a description check, and the last 4 of their ID at pickup |
| Privacy of pickup records | Admins only. Store only the last 4 of an ID. Don't photograph what's inside wallets or ID cards. |
| Wrong location data | Confirm with each building in weeks 0–2 |
| The host deletes the database file on restart | Use persistent storage, or switch to Postgres |
| Uneven workload | WS3 helps WS4 after the map is done |

## 8. Optional extras (week 7+)

- **WS1:** saved searches with email alerts when a match is turned in
- **WS2:** bulk-dispose items past their hold period, shrink photos on upload
- **WS3:** "open now" badges on locations
- **WS4:** email when a request is approved

## Next steps

1. Confirm the stack.
2. Confirm who owns which workstream.
3. Hold the session to agree on the data model and endpoints.
4. On GitHub, protect `main` (require a pull request and 1 approval) before week 1.
