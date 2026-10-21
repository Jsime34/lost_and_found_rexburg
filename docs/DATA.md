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
| `brand` | text | `"Hydro Flask"` | *(planned, Trevor)* |
| `photo` | text | `"data:image/jpeg;base64,…"` | *(planned, Trevor)* small photo shrunk in the browser (about 400 px wide) |
| `status` | text | `"available"` | *(planned)* `available`, `picked_up` (Jaime) or `donated` (Trevor). A missing status means `available`. |

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
| `status` | text | `"Pending"` when created. Later *(planned, Jaime)*: `"Approved"`, `"Rejected"`, `"Picked up"` |
| `createdAt` | timestamp | must be `serverTimestamp()` |
| `forFriend` | true/false | *(planned, Jaime)* request for a friend |
| `friendName` | text | *(planned, Jaime)* required when `forFriend` is true |
| `friendContact` | text | *(planned, Jaime)* optional |
| `adminNote` | text | *(planned, Jaime)* note from the employee who approved/rejected |

**Create:** signed-in students, in their own name only (exactly the fields above that aren't
*planned*, with status `"Pending"`) · **Read:** the student who sent it, and employees ·
**Change / delete:** employees only (students can't approve their own claim).

My Requests loads a student's claims with `where("userId", "==", their uid)`; the rules reject
any query that could return someone else's claims.

## `pickups` *(planned, Jaime)*: who took an item home

| Field | Type | Notes |
|---|---|---|
| `itemId` | text | |
| `itemName` | text | |
| `claimId` | text | the approved claim, if any |
| `pickedUpByName` | text | the person at the desk (may be the student's friend) |
| `idLast4` | text | last 4 characters of their photo ID, **never** the full number |
| `releasedBy` | text | email of the employee who handed it over |
| `pickedUpAt` | timestamp | `serverTimestamp()` |

**Read / write:** employees only.

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
