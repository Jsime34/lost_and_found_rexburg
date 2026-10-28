# Data: what we save in Firebase

Our database is **Firestore** (project `rexburg-lost-and-found`). This file lists every collection,
its fields, and who can read or change it. The rules that enforce this are in
[`firestore.rules`](../firestore.rules).

**Changing data?** Update this file first, then update `firestore.rules` in the same pull request
(Trevor owns the rules), then the code.

**Who is who:**
- **Visitor:** anyone using the website. No login needed.
- **Student:** someone signed in with **Google** (the "Sign in with Google" button in the header).
  Needed to send a claim; they can see their own claims under **My Requests**.
- **Employee:** someone who logged in on the Employees page **and** has a `users/{uid}` document
  with `role: "admin"`. Employee accounts are only created by hand in the Firebase console.

Fields marked *(planned)* don't exist yet. The person in brackets adds them.

---

## `items`: found items (public part)

| Field | Type | Example | Notes |
|---|---|---|---|
| `name` | text | `"Blue Hydro Flask"` | max 100 characters |
| `category` | text | `"Electronics"` | one of: Electronics, Bags, Keys, Clothing, Accessories, Other |
| `color` | text | `"Blue"` | |
| `location` | text | `"Library"` | where it's being kept |
| `foundAt` | timestamp | | when it was found; drives the time counter |
| `description` | text | `"32oz bottle with dents"` | what the public can see |
| `icon` | text | `"🥤"` | emoji shown when there's no photo |
| `brand` | text | `"Hydro Flask"` | from the "Record Found Item" form; may be empty |
| `photo` | text | `"data:image/jpeg;base64,…"` | *(planned, Trevor)* small photo shrunk in the browser (about 400 px wide) |
| `status` | text | `"available"` | `available`, `picked_up` (set by Record Pickup) or `donated` *(planned, Trevor)*. A missing status means `available`. Claims are only accepted while it's `available`. |

**Read:** everyone · **Add / change / delete:** employees only.
**Never** put private details here; the rules reject any item with a `privateDetails` field.

## `itemSecrets/{itemId}`: private details of found items

Same document id as the item in `items`. Saved together with the item in one batch.

| Field | Type | Example |
|---|---|---|
| `privateDetails` | text | `"Initials J.J. on the lid"` |

**Read / write:** employees only. Shown next to claims, so staff can check a claimant's story.

## `lostReports`: "Report Lost Item" form

| Field | Type | Notes |
|---|---|---|
| `name` | text | max 100 |
| `category` | text | max 50 |
| `color` | text | max 50 |
| `location` | text | max 100 |
| `date` | text | `"2026-10-12"`, from the date picker |
| `description` | text | max 1000 |
| `privateDetails` | text | max 1000 |
| `email` | text | max 200 |
| `createdAt` | timestamp | must be `serverTimestamp()` |

**Create:** anyone (exactly these fields, none empty) · **Read / change / delete:** employees only.

## `claims`: "This Might Be Mine" popup

| Field | Type | Notes |
|---|---|---|
| `itemId` | text | id of an item that exists |
| `itemName` | text | copied from the item, max 100 |
| `userId` | text | the signed-in student's account id; must match their account |
| `userName` | text | their Google name (or email), max 100 |
| `email` | text | their Google account's email; must match their account, max 200 |
| `verification` | text | what the student says proves it's theirs, max 2000 |
| `forFriend` | true/false | "I'm asking for a friend" (the friend picks it up) |
| `friendName` | text | required (max 80) when `forFriend` is true, otherwise `""` |
| `friendContact` | text | optional (max 120) when `forFriend` is true, otherwise `""` |
| `status` | text | `"Pending"` when created → `"Approved"` / `"Rejected"` → `"Picked up"` (set by employees) |
| `createdAt` | timestamp | must be `serverTimestamp()` |
| `adminNote` | text | added by employees: note for the student when approving/rejecting |
| `reviewedBy` | text | added by employees: email of the employee who approved/rejected/released it |
| `reviewedAt` | timestamp | added by employees |

**Create:** signed-in students, in their own name only, for an item that's still `available`
(exactly the fields from `itemId` to `createdAt`, with status `"Pending"`) ·
**Read:** the student who sent it, and employees ·
**Change / delete:** employees only (students can't approve their own claim).

My Requests loads a student's claims with `where("userId", "==", their uid)`; the rules reject
any query that could return someone else's claims.

## `pickups`: who took an item home (theft-control log)

Saved by **Record Pickup** (code in `public/js/pickups.js`), in one batch together with: the claim
→ `"Picked up"`, the item → `status: "picked_up"`, and any other open claims for that item →
`"Rejected"`.

| Field | Type | Notes |
|---|---|---|
| `itemId` | text | |
| `itemName` | text | |
| `claimId` | text | the approved claim |
| `claimedBy` | text | name (or email) of the student who sent the claim |
| `forFriend` | true/false | copied from the claim |
| `pickedUpByName` | text | the person at the desk (may be the student's friend), max 80 |
| `idLast4` | text | exactly 4 characters (A–Z, 0–9) of their photo ID, **never** the full number |
| `releasedBy` | text | email of the employee who handed it over; must be the logged-in employee |
| `pickedUpAt` | timestamp | `serverTimestamp()` |

**Read / add:** employees only · **Change / delete:** nobody from the website (only in the
Firebase console), so the log can be trusted.

## `users/{uid}`: employee list

| Field | Type | Example |
|---|---|---|
| `name` | text | `"Jaime Gutierrez"` |
| `email` | text | `"jaime@example.com"` |
| `role` | text | `"admin"` |

The document id is the account's **User UID** from Firebase console → Authentication.
**Read:** each person, their own document only · **Write:** nobody from the website; only in the Firebase console.

**To add an employee:**
1. Firebase console → Authentication → Users → **Add user**.
2. Firestore → `users` → **Add document**. Use the User UID as the document id, and add the three fields above.
