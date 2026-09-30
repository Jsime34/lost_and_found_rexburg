# Rexburg Lost & Found: Master Plan

An app that helps people in Rexburg, Idaho find their lost items. It lists every lost & found
location on campus. Admins log each found item with its characteristics (color, brand, type,
photo), and users run a filtered search to see which lost & found has their item.

For example, if someone lost a blue Hydro Flask water bottle, the admin enters *blue*,
*Hydro Flask* and *water bottle*. The user searches with those same filters and sees which desk
has it and how long it has been there.

**Team:** Evan (Jared Evan Jenson) · Trevor Beckstrand · Braden Griffiths · Jaime Gutierrez Zevallos

**Status:** Planning. No code yet. This is a 101-level class project, so the plan uses basic
web technology (HTML, CSS, JavaScript) and Firebase to go live.

---

## For AI coding agents: read this first

If you are an AI agent working for one of the team members:

1. **Ask your human which team member they are** (Evan, Trevor, Braden or Jaime). Don't guess from
   git usernames.
2. Read **§0 Current state**, then **your person's section in §R Roles**.
3. Work on the **first unchecked task** in your person's section, unless your human picks another.
4. **Keep the code at a 101 level.**
   - Plain HTML, CSS and JavaScript only: no React or other frameworks, no TypeScript, no build
     tools, no npm packages in the website.
   - Only the libraries in §1, loaded from their links.
   - Short, clear functions with comments, so every teammate can read them.
5. **Only edit files your person owns** (see §4 and their section). For shared files, get your
   human's OK and have them tell the team before merging.
6. Tasks marked **(human)** need a real person (meetings, Firebase console, GitHub settings).
   Remind your human about them; don't try to do them yourself.
7. Follow the data model in §2 and `docs/DATA.md` (once it exists). If something there seems
   wrong, tell your human instead of working around it.
8. When you finish a task, tick its checkbox (`[ ]` → `[x]`) in this file **in the same pull
   request**. Only tick your own person's boxes.

---

## 0. Current state (as of Wed Sep 30, 2026)

- The repo has:
  - `README.md`: title and Evan's name
  - `compiler.json`: empty; added in commit `782acfd` ("stertin"). The new plan doesn't need it.
  - `MASTER_PLAN.md`: this file
- **Sep 30:** the team switched to a simpler plan: basic HTML/CSS/JavaScript plus Firebase. It
  replaces the earlier React/Express version.
- No Firebase project, no code, and no `docs/DATA.md` yet.
- **Next steps, in order:**
  1. Jaime creates the Firebase project and adds everyone.
  2. Evan sets up the project folder and the first live page.
  3. Everyone else starts their week 1 tasks.

---

## §R. Roles

| Person | Setup role (week 1) | Feature (weeks 2–4 and on) |
|---|---|---|
| **Evan** | Setup lead: Firebase folder setup, first live page, deploys | **WS1** Search & item page |
| **Trevor** | Database lead: security rules, sample data | **WS2** Admin items & photos |
| **Braden** | Design lead: shared style, header/footer, page files | **WS3** Locations, map & time counter |
| **Jaime** | Coordinator: GitHub, Firebase project, `docs/DATA.md`, login | **WS4** Requests & pickups |

**Week 1 order:**
1. Jaime creates the Firebase project (today)
2. Evan's setup
3. Then, at the same time: Trevor's rules + sample data, Braden's style + page files, Jaime's login
4. By Fri, the site is live, and everyone can log in on it

### Evan: setup lead + WS1 Search & item page

**Owns:**
- `firebase.json`, `.firebaserc`, `public/js/firebase.js`
- WS1: `public/index.html`, `public/js/search.js`, `public/item.html`, `public/js/item.js`

**Week 1**
- [ ] (human) Install the Firebase tools (`npm install -g firebase-tools`), then run `firebase login`.
- [ ] (human) Ask who added `compiler.json` and whether it's still needed. If not, delete it in the setup pull request.
- [ ] **Everyone is waiting on this.** Set up the project folder:
  - run `firebase init`, choosing Hosting (folder `public`) and Firestore
  - create `public/js/firebase.js` with the web config from the Firebase console; it starts Firebase and shares `auth` and `db` with every page
- [ ] Put a simple "Coming soon" `index.html` live with `firebase deploy`, and post the live link in team chat.
- [ ] Add a short "How to run it" section to `README.md`: open the folder in VS Code, use the Live Server extension, and deploy with `firebase deploy`.
- [ ] (human) In Firebase console → Authentication → Settings → Authorized domains, add `127.0.0.1` so logging in works with Live Server.

**Weeks 2–4 (WS1)**
- [ ] Search page (`index.html` + `search.js`)
  - load the available items once, then filter them in JavaScript by type, color, brand, location and typed words
  - sort by newest or oldest
- [ ] Result cards: photo, title, color, brand, location, and how long the item has been there (Braden's `time.js`).
- [ ] Messages for "loading…", "no items match" and errors.
- [ ] Item page (`item.html?id=…`)
  - photo, all details, the time counter, the location's hours, and a link to the map
  - a "Request this item" button that goes to `request.html?item=…` (Jaime's page)

**Others wait on you for:** the Firebase setup and `firebase.js` (everyone, early week 1).
**You wait on:** Trevor's sample data and Braden's `time.js`.

### Trevor: database lead + WS2 Admin items & photos

**Owns:**
- `firestore.rules`
- `public/seed.html` + `public/js/seed.js`
- WS2: `public/admin-items.html`, `public/js/admin-items.js`

**Week 1 (after Evan's setup)**
- [ ] First version of `firestore.rules`, based on §2 and `docs/DATA.md`:
  - anyone can read items and locations; only admins can change them
  - users can create and read only their own requests; admins can read and update all requests
  - pickups are admin only
  - nobody can make themselves an admin
- [ ] `seed.html`: an admin-only page with an "Add sample data" button.
  - It adds the locations (Braden's real ones if ready, otherwise marked DEMO) and about 15 items.
  - Post in team chat when sample data is in.

**Weeks 2–4 (WS2)**
- [ ] Admin items page (`admin-items.html`), admins only: a form to add an item.
  - fields: title, type, color, brand, description, where found, date found, location (dropdown), photo
- [ ] Photo: shrink it in the browser (about 400 px wide, JPEG) before saving, so it stays small (see §7).
- [ ] A list of all items with **Edit**, **Remove** and **Mark as donated** buttons.
- [ ] Update `firestore.rules` whenever someone adds a collection or field.

**Others wait on you for:**
- security rules (everyone, before real data goes in)
- sample data (Evan and Jaime, end of week 1)

**You wait on:** Evan's setup, Jaime's `auth.js` (for the admin check).

### Braden: design lead + WS3 Locations, map & time counter

**Owns:**
- `public/css/style.css`, `public/js/nav.js`, `public/js/time.js`
- WS3: `public/map.html`, `public/js/map.js`, `public/admin-locations.html`, `public/js/admin-locations.js`

**Week 1 (after Evan's setup)**
- [ ] (human) Find the real lost & found desks: which buildings run one, their hours, and how long they keep items. Start with the Manwaring Center information desk. Write them in `docs/locations.md`.
- [ ] `style.css`: colors, fonts, buttons, forms and cards, readable on phones.
- [ ] `nav.js`: adds the same header (links: Search, Map, My requests, Admin, Log in/out) and footer to every page.
- [ ] Create **every page file** from §4 with the header, footer and a "Coming soon" message, so nobody else has to create pages later.

**Weeks 2–4 (WS3)**
- [ ] **Early week 2, Evan needs it:** `time.js` with two helpers.
  - `timeInLostAndFound(foundAt)` returns text like "3 days".
  - `daysLeft(foundAt, holdDays)` returns a number, e.g. for "27 days left before donation".
- [ ] Map page (`map.html`, using Leaflet)
  - a marker for each location, showing its hours and number of items
  - a "See items here" link to `index.html?location=…`
  - a list of the locations under the map
- [ ] Admin locations page, admins only: add, edit and remove locations. Clicking the map fills in the latitude and longitude.
- [ ] When WS3 is done, help Jaime with WS4.

**Others wait on you for:**
- page files + header (everyone, week 1)
- `time.js` (Evan, early week 2)

**You wait on:** Evan's setup.

### Jaime: coordinator + login + WS4 Requests & pickups

**Owns:**
- GitHub repo settings (Jaime owns the repo), the Firebase project settings, this plan, `docs/DATA.md`
- Login: `public/login.html`, `public/js/login.js`, `public/js/auth.js`
- WS4:
  - `public/request.html` + `public/js/request.js`
  - `public/my-requests.html` + `public/js/my-requests.js`
  - `public/admin-requests.html` + `public/js/admin-requests.js`
  - `public/pickups.html` + `public/js/pickups.js`

**Week 1**
- [x] Push `MASTER_PLAN.md` to GitHub.
- [ ] (human) **Today, everyone is waiting on this:** set up Firebase.
  - Create the Firebase project on the free **Spark** plan; no credit card.
  - Turn on **Authentication** (Email/Password) and **Firestore**.
  - Add Evan, Trevor and Braden in Project settings → Users and permissions.
- [ ] (human) Make sure all 4 have write access on GitHub. Protect `main`: require a pull request with 1 approval.
- [ ] (human) Share this simpler plan with the team, and get a 👍 from everyone.
- [ ] Write `docs/DATA.md`: every collection from §2, its fields, and who can read and write it. Trevor turns this into the security rules.
- [ ] Login page (`login.html`)
  - sign up and log in with email and password
  - on sign-up, create the `users/{uid}` document with role `user`
- [ ] `auth.js`: small helpers every page can use.
  - `getCurrentUser()` and `isAdmin()`
  - `requireLogin()` and `requireAdmin()`, which send people to `login.html` if needed
- [ ] Write in `README.md` how to make someone an admin: in the Firebase console, set `role` to `admin` on their `users` document.

**Weeks 2–4 (WS4)**
- [ ] Request page (`request.html?item=…`), logged in only
  - a "Describe the item" box
  - a "This is for a friend" checkbox that shows the friend's name and contact fields
  - saves a `requests` document with status `pending`
- [ ] My requests page: the user's requests with their status; pending ones can be cancelled.
- [ ] Admin requests page
  - pending requests, each next to its item, with **Approve** / **Reject** and an optional note
  - **Record pickup** on an approved request: who picked it up and the last 4 of their ID
  - recording a pickup marks the item `picked_up` and saves a `pickups` document
- [ ] Pickup log page, admins only: every pickup, newest first.

**Others wait on you for:**
- the Firebase project (everyone, today)
- `auth.js` (Trevor and Braden's admin pages, end of week 1)

**You wait on:** Evan's setup, Braden's page files, Trevor's rules and sample data.

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
| 7 | Post a picture of each item | WS2 (Trevor) |

**Theft control:** anyone requesting an item has to describe it, and staff check the description.
Each pickup records the person's name, the last 4 characters of their ID, and which admin released it.

---

## 1. Technology

Everything here is free, with no credit card (Firebase **Spark** plan).

| Part | What we use |
|---|---|
| Pages | **HTML** |
| Look | **CSS**, in one shared `style.css` |
| Behavior | **JavaScript**, plain, no frameworks |
| Database | **Firebase Firestore** |
| Login | **Firebase Authentication** (email + password) |
| Going live | **Firebase Hosting**, deployed with the Firebase CLI (`firebase deploy`) |
| Map | **Leaflet + OpenStreetMap**, loaded from a link; no API key |
| Photos | Shrunk in the browser and saved in Firestore (see §7 for why not Firebase Storage) |
| Tools | **VS Code** + the **Live Server** extension, **Git + GitHub** |

Firebase is loaded in each page from Firebase's own links (the "CDN" setup in their docs), so there's
nothing to build or install for the website itself.

## 2. Data model (Firestore collections)

| Collection | Fields | Who can read / write |
|---|---|---|
| `users/{uid}` | name, email, role (`user` or `admin`) | read: that user and admins · created at sign-up with role `user` · only changed in the console |
| `locations` | name, building, address, lat, lng, hours, holdDays | read: everyone · write: admins |
| `items` | title, type, color, brand, description, foundWhere, foundAt, locationId, locationName, status, photo | read: everyone · write: admins |
| `requests` | itemId, itemTitle, userId, userName, userEmail, forFriend, friendName, friendContact, message, status, adminNote, createdAt | create: logged-in users (their own) · read: owner and admins · update: admins · cancel: owner, while pending |
| `pickups` | itemId, itemTitle, requestId, pickedUpByName, idLast4, releasedBy, pickedUpAt | admins only |

- **Item status:** `available → picked_up`, or `disposed` when donated after the hold period.
- **Request status:** `pending → approved → picked_up`, or `rejected`. The user can cancel while it's `pending`.
- `locationName` and `itemTitle` are copied into items and requests so pages don't need extra lookups.

## 3. Workstreams

| Workstream | Pages |
|---|---|
| **WS1 Search & item page** (Evan) | Search page with filters, result cards with photo and time counter, item page with a "Request this item" button |
| **WS2 Admin items & photos** (Trevor) | Admin page to add, edit, remove and donate items, with a photo |
| **WS3 Locations, map & time counter** (Braden) | Map with a marker per desk, admin locations page, time counter helpers |
| **WS4 Requests & pickups** (Jaime) | Login, request form (for yourself or a friend), my requests, admin review + record pickup, pickup log |

WS4 has the most work, so Braden joins Jaime once WS3 is done.

## 4. Files and who owns them

```
public/                     ← the website (what Firebase Hosting serves)
  index.html  js/search.js           Search (home page)       Evan
  item.html   js/item.js             Item details             Evan
  admin-items.html  js/admin-items.js   Add/edit/remove items  Trevor
  seed.html   js/seed.js             Add sample data (admin)  Trevor
  map.html    js/map.js              Map of locations         Braden
  admin-locations.html  js/admin-locations.js  Manage locations  Braden
  login.html  js/login.js            Log in / sign up         Jaime
  request.html  js/request.js        Request an item          Jaime
  my-requests.html  js/my-requests.js   My requests           Jaime
  admin-requests.html  js/admin-requests.js  Review + pickups Jaime
  pickups.html  js/pickups.js        Pickup log               Jaime
  css/style.css                      Shared styles            Braden (shared)
  js/firebase.js                     Firebase setup           Evan   (shared)
  js/auth.js                         Login helpers            Jaime  (shared)
  js/nav.js                          Header + footer          Braden (shared)
  js/time.js                         Time counter helpers     Braden (shared)
firestore.rules                      Database security rules  Trevor (shared)
firebase.json, .firebaserc           Firebase settings        Evan   (shared)
docs/DATA.md                         Collections and fields   Jaime  (shared)
```

**Working in parallel without collisions:**
1. **One page = one owner.** Each page has its own HTML and JS file, so people rarely edit the same file.
2. **Shared files** (marked "shared" above) need a heads-up in team chat and a review from another teammate.
3. **Link to each other's pages** instead of copying code, e.g. the item page links to `request.html?item=…`.
4. **Data changes go in `docs/DATA.md` first**, then Trevor updates `firestore.rules`.

## 5. Timeline

Assumes a final demo the week of Nov 30, 2026. Adjust the dates to the course calendar.

| Week | Dates | Goal | Done when |
|---|---|---|---|
| 1 | Sep 28 – Oct 2 | Setup (see §R): Firebase project, folder setup, first live page, rules, sample data, style, login | The site is live and everyone can log in on it |
| 2–4 | Oct 5–23 | Features, all four workstreams at once | Each page works with the sample data |
| 5 | Oct 26 | **Full-flow check:** admin adds an item with a photo → student finds it → requests it for a friend → admin approves → friend picks it up → it shows in the pickup log | The full flow works on the live site |
| 6 | Nov 2 | Make it solid: phone layout, loading/empty/error messages, real location data | Known bugs listed and being worked |
| 7 | Nov 9 | One optional extra per person (§8) | |
| 8 | Nov 16 | Test with 3–5 real students on the live site | Feedback written down |
| 9 | Nov 23 | Fix the top feedback (short week, Thanksgiving) | |
| 10 | Nov 30 | No new features 48 hours before the demo; rehearse it | Final demo |

**Weekly routine:** short written check-ins Mon/Wed/Fri (done / next / blocked), one 30-minute
call a week to try the live site together, and pull request reviews within 24 hours.

## 6. Git workflow

- Before starting a task, run `git pull` on `main`, then make a branch, e.g. `evan/search-filters`
  or `braden/map-page`.
- Commit small steps with clear messages ("Add color filter").
- Open a pull request. One teammate reviews it before it merges into `main`.
- **Deploy only from an up-to-date `main`:** run `git pull`, then `firebase deploy`.

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
| Photo storage (Firebase Storage) requires the paid Blaze plan since Feb 3, 2026, which needs a credit card | Shrink each photo in the browser (about 400 px wide, JPEG) and save it in the item's Firestore document; that's free. Upgrading later is an optional extra (§8). |
| Anyone can open the browser console and try to change data | `firestore.rules`: only admins can change items, locations and pickups, and nobody can make themselves admin |
| Free-plan limits (e.g. 50,000 database reads per day) | Plenty for a class. Load the list once and filter in JavaScript; don't reload on every keystroke. |
| The Firebase web config is visible in the repo | That's normal for Firebase websites; the security rules protect the data. Never commit private keys or service-account files. |
| Privacy of pickup records | Admins only. Store only the last 4 characters of an ID. |
| Wrong location data | Braden confirms with each building in weeks 1–2 |
| Uneven workload | Braden helps Jaime after WS3 is done |

## 8. Optional extras (week 7+)

- **Evan:** keep the filters in the page address so searches can be shared; "similar colors" (navy ≈ blue)
- **Trevor:** hidden details only staff can see (serial number, name inside), kept in an admin-only collection and checked against requests; a "donate all expired items" button
- **Braden:** "open now" badge on each location; a walking-directions link
- **Jaime:** a badge showing how many requests are waiting for review
- **Team:** more and bigger photos with Firebase Storage (needs the Blaze plan with a card; set a $1 budget alert first)
