# Rexburg Lost & Found: Master Plan

An app that helps people in Rexburg, Idaho find their lost items. Employees log each found item with
its characteristics (type, color, brand, photo), and students search with filters to see which
lost & found has their item, how long it has been there, and claim it.

For example, if someone lost a blue Hydro Flask water bottle, the employee enters *blue*,
*Hydro Flask* and *water bottle*. The student searches with those same filters and sees where it is.

**Team:** Evan (Jared Evan Jenson) · Trevor Beckstrand · Braden Griffiths · Jaime Gutierrez Zevallos

**Live site:** https://rexburg-lost-and-found.web.app

**Status:** Week 3 of 10. The site is live and connected to Firebase, with security rules and an
employee login. Now: building the remaining features (§R). This is a 101-level class project, so
we use basic web technology (HTML, CSS, JavaScript) and Firebase.

---

## For AI coding agents: read this first

If you are an AI agent working for one of the team members:

1. **Ask your human which team member they are** (Evan, Trevor, Braden or Jaime). Don't guess from
   git usernames.
2. Read **§0 Current state**, **§4 Files**, then **your person's section in §R Roles**.
3. Work on the **first unchecked task** in your person's section, unless your human picks another.
4. **Keep the code at a 101 level.**
   - Plain HTML, CSS and JavaScript only: no React or other frameworks, no TypeScript, no build
     tools, no npm packages in the website.
   - Only the libraries in §1, loaded from their links.
   - Short, clear functions with comments, so every teammate can read them.
5. **Avoid editing other people's code** (see §4).
   - Put new code in **your own file** under `public/js/`, and import it from `script.js` with
     one line.
   - In `index.html`, `script.js` and `styles.css`, only change your own sections. For anything
     else, get your human's OK and have them tell the team first.
6. **Data and security:**
   - Follow [`docs/DATA.md`](docs/DATA.md). Any new collection or field goes there first.
   - Then add it to `firestore.rules`, in the same pull request. Without that, Firebase will
     reject the save.
   - Always put text from the database on the page with `escapeHtml()`.
7. **The live database is shared.** Live Server on your computer uses the **real** database. Test
   with obviously fake data, and delete it when you're done.
8. Tasks marked **(human)** need a real person (meetings, Firebase console, GitHub settings).
   Remind your human about them; don't try to do them yourself.
9. When you finish a task, tick its checkbox (`[ ]` → `[x]`) in this file **in the same pull
   request**. Only tick your own person's boxes.

---

## 0. Current state (as of Wed Oct 28, 2026)

**Working on the live site** (or in the WS4 pull request, waiting to merge):
- **Home page:** intro, stats (unclaimed items, found this week, places with items), recent items
- **Found Items:** search by text, plus category, color and location filters
- **Report Lost Item:** students send a lost report
- **"This Might Be Mine":** students **sign in with Google** and send a claim with a description; their name and email come from their Google account. They can ask **for a friend** (the friend picks it up).
- **My Requests:** signed-in students see their own claims, each one's status (Pending / Approved / Rejected / Picked up) and the desk's note
- **Employees page:**
  - log in (employee accounts only)
  - record a found item (with brand), with private details kept employee-only
  - "Add sample items" button, shown when the database is empty
  - list of lost reports
  - **Claims to Review:** private details next to each claim, **Approve / Reject** with a note, then **Record Pickup** (who took it + last 4 of their ID). Recording a pickup marks the item `picked_up` and rejects other open claims for it.
  - **Pickup Log:** who took each item home and which employee released it; it can't be edited from the website
- **Time counter helpers** (`js/time.js`), ready for Evan's cards
- **Security rules:** visitors can't read private details, lost reports, claims or the employee
  list; students only see their own claims; only employees change items and record pickups;
  nobody can claim an item that's already picked up

**Not built yet** (see §R):
- time counter **on the cards** (Evan; the helpers are ready)
- hiding picked-up/donated items from search (Evan)
- map and real locations (Braden)
- color dropdown, `status` on new items, edit/remove/donate, photos (Trevor)
- sort, brand in search (Evan)

**History:**
- **Sep 23–30:** plan written, then simplified to HTML/CSS/JS + Firebase.
- **Oct 7:** first front end (Trevor), Firebase Hosting set up (Evan).
- **Oct 14:**
  - connected to the database (pull request #2)
  - security rules, employee login and private details (#3)
  - deployed
- **Oct 21:**
  - Home section fix and no-cache setting (#5)
  - color filter (Evan, then fixed in #6)
  - Brand field (Trevor)
  - Google sign-in + My Requests (#7)
- **Oct 26:** full-flow check postponed (approve/pickup didn't exist yet). New date: **Mon Nov 2**.
- **Oct 28:** Jaime took over `time.js` from Braden. WS4 done: approve/reject, for a friend, pickups, pickup log.

**The code is one page.** `index.html` has sections that the nav buttons show and hide, and
`script.js` holds the code. This replaced the earlier idea of separate HTML pages.

---

## §R. Roles

| Person | Owns | Remaining focus |
|---|---|---|
| **Evan** | Search, item cards, lost reports, deploy setup | **Hide picked-up items** and **time counter on cards** (both needed for Nov 2), then sort, brand in search |
| **Trevor** | Employee item tools, photos, security rules | Color dropdown, `status` on new items, edit/remove/donate, photos; review WS4 rules |
| **Braden** | Design, locations, map | Real locations, map page, mobile fixes (`time.js` was taken over by Jaime) |
| **Jaime** | Coordination, Firebase, login, claims & pickups | Coordination, the Nov 2 full-flow check, helping whoever is behind |

**Order that matters (week 5, before the Mon Nov 2 full-flow check):**
- **By Fri Oct 30:**
  - **Evan:** hide picked-up/donated items from search (Jaime's pickups already set `status: "picked_up"`), and show the time counter on cards (`js/time.js` is ready).
  - **Trevor:** `status: "available"` on new items, and the color dropdown.
  - **Braden:** `locations.js` with the real desks (his map needs it).
- **Mon Nov 2:** full-flow check (§5).

### Evan: search & item cards

**Owns:**
- **`index.html`:** the `#browse` section (Found Items), the `#lost` section (Report Lost Item), and the "Recent Lost Reports" panel inside `#admin`
- **`script.js`:** the sections "ITEM ICON", "CREATE ITEM CARD", "DISPLAY FOUND ITEMS", "RECENT ITEMS", "SEARCH / FILTER", "LOST ITEM FORM", "DISPLAY LOST REPORTS FOR EMPLOYEES"
- `firebase.json`, `.firebaserc`, `README.md`
- New file `public/js/search.js` if search code grows

**Done**
- [x] (human) Install the Firebase tools and run `firebase login`.
- [x] Set up Firebase Hosting (`firebase init`) and put the first site live.
- [x] Delete the unused `compiler.json`.

**Week 3–4**
- [x] Add a "How to run it" section to `README.md`:
  - open the folder in VS Code and use the **Live Server** extension
  - Live Server uses the real database
  - deploy only from `main` with `firebase deploy`
- [x] (human) Firebase console → Authentication → Settings → Authorized domains: add `127.0.0.1`, so employee login works with Live Server.
- [x] Color filter: a dropdown next to Category, using the same color list as Trevor's form.
- [ ] Search also matches `brand` (after Trevor adds it), and the card shows the brand.
- [ ] Sort: "Newest first" / "Oldest first" dropdown.
- [ ] **Needed for Nov 2:** cards show "In lost & found for 3 days · 27 days left before donation". `js/time.js` is ready: `import { timeCounterText } from "./js/time.js";` then `timeCounterText(item.foundAt)` gives the whole sentence.
- [ ] **Needed for Nov 2:** hide items whose `status` is `picked_up` or `donated`. A missing status counts as available. (Recording a pickup already sets `status: "picked_up"`.)
- [ ] Cards show the item's `photo` when it has one (after Trevor adds photos), and the emoji otherwise.

**Others wait on you for:** brand/color filters and sort before the week 5 full-flow check.
**You wait on:**
- Braden: `time.js` and `locations.js`
- Trevor: the `status`, `brand` and `photo` fields

### Trevor: employee item tools, photos & security rules

**Owns:**
- **`index.html`:** the "Record Found Item" panel inside `#admin`
- **`script.js`:** the sections "SAMPLE DATA", "EMPLOYEE ADDS FOUND ITEM" and "SAMPLE DATA BUTTON (EMPLOYEE PAGE)"
- `firestore.rules` (reviews every rules change), `styles.css` (shared with Braden)
- New file `public/js/admin-items.js` for the new item tools

**Done**
- [x] First front end: the page layout, forms and stylesheet.
- [x] First version of `firestore.rules`, written with Jaime in pull request #3.
- [x] "Add sample items" button.

**Week 3–4**
- [ ] "Record Found Item" form:
  - [x] add a **Brand** field. (Small fix: it's inside the Color `form-group`; give it its own `<div class="form-group">` so it has normal spacing.)
  - [ ] change **Color** to a dropdown with a fixed list (use the same colors as Evan's color filter, including Silver)
- [ ] New items get `status: "available"`.
- [ ] Employee list of all items (new panel), with buttons:
  - **Edit**
  - **Remove**, which also deletes its `itemSecrets` document, in one batch
  - **Mark as donated**, which sets `status: "donated"`
- [ ] Photo on the form:
  - shrink it in the browser to about 400 px wide (JPEG, using a canvas)
  - save it as the item's `photo` field (see §7 for why not Firebase Storage)
- [ ] Review the rules changes in Jaime's pickups pull request.

**Others wait on you for:** `status: "available"` and the color list (by Fri Oct 30).
**You wait on:** nothing.

### Braden: design, locations & map

**Owns:**
- **`index.html`:** the `#home` section, the header/nav, and the new `#map` section
- **`script.js`:** the sections "PAGE NAVIGATION" and "UPDATE HOME PAGE STATISTICS"
- `styles.css` (shared with Trevor)
- New files `public/js/locations.js`, `public/js/map.js`

**Week 3–4**
- [ ] (human) Find the real lost & found desks: which buildings run one, their hours, and how long they keep items. Start with the Manwaring Center information desk. Write them in `docs/locations.md`.
- [ ] **Early week 3, Evan and Trevor need it:** `js/locations.js`.
  - It's a list of the desks: name, latitude/longitude, hours, and `holdDays` (how long items are kept).
  - Replace the made-up "Library / Student Union / Science Building / Gym / Business Building" options in all 3 location dropdowns with the real ones.
- [x] `js/time.js`: **taken over and done by Jaime (Oct 28)** so Evan wasn't blocked. When `locations.js` has `holdDays` per desk, pass it as the second argument of `timeCounterText` / `daysLeft`.
- [ ] Map page:
  - add a **Map** nav button and a `#map` section
  - use Leaflet + OpenStreetMap, loaded from their links
  - each desk gets a marker showing its hours and number of items
  - a "See items here" button opens Found Items filtered to that location
- [ ] Mobile fix: on short screens the claim popup can't scroll, so its **Submit Claim** button is out of reach. Add `overflow-y: auto` to `.modal` in `styles.css`.
- [ ] Check every section at phone width (375 px).
- [ ] When this is done, help Evan or Trevor, whoever is behind. (WS4 is done.)

**Others wait on you for:** `locations.js` (real desks for the location filters and the map, by Fri Oct 30).
**You wait on:** nothing.

### Jaime: coordination, login, claims & pickups

**Owns:**
- GitHub repo settings, Firebase project settings, this plan, `docs/DATA.md`
- **`index.html`:** the employee login and the "Claims to Review" panel inside `#admin`, the claim popup (`#claimModal`), the `#requests` section (My Requests), and the Google sign-in area in the header (`.auth-area`)
- **`script.js`:** the sections "FIREBASE", "HELPERS", "LOAD DATA FROM FIREBASE", "CLAIM MODAL", "SUBMIT CLAIM", "DISPLAY CLAIMS FOR EMPLOYEES", "STUDENT SIGN IN (GOOGLE) + MY REQUESTS", "EMPLOYEE LOG IN / LOG OUT", "INITIAL PAGE LOAD"
- `public/js/firebase.js`
- `public/js/pickups.js` (approve, reject, record pickup, pickup log)
- `public/js/time.js` (taken over from Braden)

**Done**
- [x] Push `MASTER_PLAN.md` to GitHub.
- [x] (human) Create the Firebase project (free Spark plan) with Authentication and Firestore, and add the team.
- [x] Connect the site to the database (pull request #2).
- [x] Security rules, employee login, and employee-only private details (#3), then deploy.
- [x] Write `docs/DATA.md`.
- [x] Student sign-in with Google: claims need sign-in and use the account's name and email; new **My Requests** tab; rules let students read only their own claims.
- [x] (human) Firebase console → Authentication → Sign-in method → turn on **Google**; set the Public-facing name to "Rexburg Lost & Found".
- [x] `js/time.js` time-counter helpers (taken over from Braden, Oct 28).

**Week 3–5**
- [ ] (human) Create an employee account for each teammate: Authentication → Add user, plus a `users/{uid}` document with `role: "admin"` (steps in `docs/DATA.md`).
- [ ] (human) Protect `main` on GitHub (Settings → Branches): require a pull request with 1 approval.
- [ ] (human) Share this updated plan with the team and get a 👍 from everyone.
- [x] Claim popup: a "This is for a friend" checkbox that shows the friend's name and contact fields. Update `docs/DATA.md` and `firestore.rules` for the new fields.
- [x] Claims to Review: **Approve** / **Reject** buttons with an optional note.
- [x] **Record pickup** on an approved claim:
  - ask who is picking it up and the last 4 characters of their ID
  - save a `pickups` document, set the item's `status` to `picked_up`, and set the claim to `"Picked up"`, all in one batch (other open claims for the item are rejected in the same batch)
- [x] Pickup log panel for employees: every pickup, newest first. It can't be edited or deleted from the website.
- [x] Rules for `pickups` and the claim updates (Trevor reviews).
- [ ] (human) Run the full-flow check with the team on **Mon Nov 2** (§5).

**Others wait on you for:** nothing right now.
**You wait on:** Evan (hide picked-up items, time counter on cards) for the full-flow check.

---

## Problem

Many people can't find their items after losing them, and a lost & found can't easily prove
who took an item home. This app:

- helps people find lost items quickly
- helps stop theft from the lost & found by recording who picks each item up

## Features

| # | Feature (from our submission) | Owner | Status |
|---|---|---|---|
| 1 | Search and filter by type, color, brand and location | Evan | 🟡 Text, category, color and location work; brand in search and sort to do |
| 2 | Employees can add and remove items | Trevor | 🟡 Adding works (with brand); edit/remove/donate to do |
| 3 | Time counter: how long an item has been there, and days left before it's donated | Jaime (helpers) + Evan (cards) | 🟡 Helpers done (`js/time.js`); showing it on the cards to do |
| 4 | Map of lost & found locations | Braden | 🔴 To do |
| 5 | Request an item for a friend | Jaime | ✅ Done (WS4 pull request) |
| 6 | Record of who picked the item up | Jaime | ✅ Done: Record Pickup + Pickup Log (WS4 pull request) |
| 7 | Post a picture of each item | Trevor | 🔴 To do |
| + | Lost reports (students describe what they lost) | Evan | ✅ Done |
| + | Private details only employees see, shown next to claims | Jaime | ✅ Done |

**Theft control:** claimants describe the item, and employees compare that with private details
the public never sees. Each pickup will record the person's name, the last 4 characters of their
ID, and which employee released it.

---

## 1. Technology

Everything here is free, with no credit card (Firebase **Spark** plan).

| Part | What we use |
|---|---|
| Page | **HTML**: one page, `public/index.html`, with sections the nav shows and hides |
| Look | **CSS**: `public/styles.css` |
| Behavior | **JavaScript**: plain, loaded as a module (`<script type="module">`) so files can import each other |
| Database | **Firebase Firestore**, protected by `firestore.rules` |
| Login | **Firebase Authentication** (email + password), for employees only |
| Going live | **Firebase Hosting**, deployed with `firebase deploy` |
| Map | **Leaflet + OpenStreetMap**, loaded from a link; no API key |
| Photos | Shrunk in the browser and saved in Firestore (see §7 for why not Firebase Storage) |
| Tools | **VS Code** + the **Live Server** extension, **Git + GitHub** |

Firebase is loaded from Firebase's own links in `public/js/firebase.js`. Every file imports
Firebase functions from there, so all files use the same version.

## 2. Data

Full details, with every field and who can read or write it, are in
**[`docs/DATA.md`](docs/DATA.md)**. In short:

| Collection | What | Read | Write |
|---|---|---|---|
| `items` | found items (public part) | everyone | employees |
| `itemSecrets` | private details of each item | employees | employees |
| `lostReports` | "Report Lost Item" form | employees | anyone can send one |
| `claims` | "This Might Be Mine" popup | employees | anyone can send one |
| `pickups` *(planned)* | who took an item home | employees | employees |
| `users` | employee list | own entry only | Firebase console only |

- **Item status** *(planned)*: `available` → `picked_up`, or `donated` after the hold period.
- **Claim status:** `Pending` → `Approved` → `Picked up`, or `Rejected`.

## 3. Workstreams

| Workstream | What |
|---|---|
| **WS1 Search & cards** (Evan) | Filters, sort, item cards with time counter and photo, lost reports |
| **WS2 Employee item tools** (Trevor) | Record/edit/remove/donate items, photos, security rules |
| **WS3 Locations, map & time** (Braden) | Real locations list, map section, time helpers, design and mobile |
| **WS4 Claims & pickups** (Jaime) | Claim popup (incl. for a friend), approve/reject, record pickup, pickup log |

WS4 has the most work, so Braden joins Jaime once WS3 is done.

## 4. Files and who owns them

```
public/
  index.html        one page; each section has an owner (see §R)
    #home, header/nav, #map (new)       Braden
    #browse (Found Items), #lost        Evan
    #admin: Record Found Item           Trevor
    #admin: login, Claims to Review     Jaime
    #admin: Recent Lost Reports         Evan
    #claimModal (claim popup)           Jaime
    #requests (My Requests), header sign-in  Jaime
  script.js         main code; each "// ====" section has an owner (see §R)
  styles.css        shared: Braden + Trevor
  js/firebase.js    Firebase setup                         Jaime  (shared)
  js/locations.js   list of lost & found desks (new)       Braden (shared)
  js/time.js        time counter helpers (new)             Braden (shared)
  js/map.js         map section (new)                      Braden
  js/search.js      search helpers (new, if needed)        Evan
  js/admin-items.js employee item tools (new)              Trevor
  js/pickups.js     claims review + pickups (new)          Jaime
firestore.rules     database security rules                Trevor (shared)
firebase.json, .firebaserc  Firebase settings              Evan   (shared)
docs/DATA.md        collections and fields                 Jaime  (shared)
MASTER_PLAN.md      this plan                              Jaime
```

**Working in parallel without collisions:**
1. **New code goes in your own file in `public/js/`.** `script.js` imports it with one line, e.g. `import { timeInLostAndFound } from "./js/time.js";`.
2. **In shared files, only touch your own sections.** Shared files are `index.html`, `script.js`, `styles.css`, and anything marked "shared". Tell the team before changing anyone else's.
3. **Data changes go in `docs/DATA.md` first,** then in `firestore.rules`, in the same pull request.
4. **Pull often** (`git pull` on `main`) so your branch doesn't drift far from everyone else's.

## 5. Timeline

Assumes a final demo the week of Nov 30, 2026. Adjust the dates to the course calendar.

| Week | Dates | Goal | Status |
|---|---|---|---|
| 1–2 | Sep 28 – Oct 9 | Setup: Firebase, live site, first front end | ✅ Done |
| 3 | Oct 12–16 | Database connection, security rules, employee login | ✅ Done |
| 4 | Oct 19–23 | Features: color filter, brand, Google sign-in + My Requests | ✅ Done (map, photos, edit/remove still open) |
| 5 | Oct 26–30 | WS4 done (for a friend, approve/reject, pickups, pickup log) + `time.js`. By Fri: hide picked-up items, time counter on cards, `status`, color dropdown, `locations.js` | 👉 **We are here** |
| 6 | **Mon Nov 2** | **Full-flow check** (moved from Oct 26): employee adds an item → student finds it → requests it for a friend → employee approves → friend picks it up → it shows in the pickup log and disappears from search. Then: phone layout, loading/empty/error messages, real location data, map, photos | |
| 7 | Nov 9 | One optional extra per person (§8) | |
| 8 | Nov 16 | Test with 3–5 real students on the live site | |
| 9 | Nov 23 | Fix the top feedback (short week, Thanksgiving) | |
| 10 | Nov 30 | No new features 48 hours before the demo; rehearse it | |

**Weekly routine:** short written check-ins Mon/Wed/Fri (done / next / blocked), one 30-minute
call a week to try the live site together, and pull request reviews within 24 hours.

## 6. Git workflow

- Before starting a task, run `git pull` on `main`, then make a branch, e.g. `evan/color-filter`
  or `braden/map`.
- Commit small steps with clear messages ("Add color filter").
- Open a pull request. One teammate reviews it before it merges into `main`. Nobody pushes to
  `main` directly.
- **Deploy only from an up-to-date `main`,** after the merge: run `git pull`, then `firebase deploy`.
  This deploys the website **and** the security rules together.

**A task is done when:**
- it works on a computer and on a phone
- it shows a message while loading, when nothing is found, and when something fails
- you tested it yourself and wrote what you tested in the pull request
- `docs/DATA.md` and `firestore.rules` are updated if you changed any data
- a teammate reviewed it
- its checkbox in §R is ticked
- it's deployed, and you checked it on the live site

## 7. Risks

| Risk | What to do about it |
|---|---|
| Everyone edits the same `script.js` / `index.html` | Put new code in your own `js/` file; only touch your own sections; pull often |
| Live Server uses the real, shared database | Use obviously fake test data and delete it afterwards |
| A new field or collection isn't in the rules | Firebase rejects the save. Add it to `docs/DATA.md` and `firestore.rules` in the same pull request. |
| Photo storage (Firebase Storage) requires the paid Blaze plan since Feb 3, 2026, which needs a credit card | Shrink each photo to about 400 px wide and save it in the item's document; that's free. Upgrading later is an optional extra. |
| The Firebase web config (API key) is visible in the code | That's normal for Firebase websites; the security rules protect the data. Never commit private keys or service-account files. |
| Someone claims an item from its public description | Employees compare the claim with the private details; pickups record the name and last 4 of their ID |
| Privacy of student emails and pickup records | Employees only (enforced by the rules). Store only the last 4 characters of an ID. |
| Wrong location data | Braden confirms with each building in week 3 |
| Uneven workload | Braden helps Jaime after WS3 is done |

## 8. Optional extras (week 7+)

- **Evan:** keep the filters in the page address so searches can be shared; show employees possible matches between lost reports and found items
- **Trevor:** a "donate all expired items" button
- **Braden:** "open now" badge on each location; a walking-directions link; an employee page to edit locations
- **Jaime:** a badge showing how many claims are waiting for review; Firebase App Check
- **Team:** more and bigger photos with Firebase Storage (needs the Blaze plan with a card; set a $1 budget alert first)
