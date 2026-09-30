# API contract

> **Status: DRAFT.** The team agrees on this in the design session. After that, any change goes
> through a small pull request that the other side's owner reviews.
>
> Each owner fills in **their own section only**, so there are no merge conflicts:
> Auth + WS4 = Jaime · WS1 = Evan · WS2 = Trevor · WS3 = Braden.
> Conventions and common objects are owned by Jaime. Suggest changes to them in team chat.

---

## Conventions (every endpoint)

- **Base path:** `/api`. Requests and responses are JSON, except photo uploads (`multipart/form-data`).
- **Auth:** logging in or registering sets an httpOnly cookie named `lf_session`. The browser sends it
  automatically; client code calls `fetch` with `credentials: 'include'`.
- **Access levels** used in the tables below:

  | Access | Who |
  |---|---|
  | public | anyone, logged in or not |
  | user | any logged-in account |
  | admin | accounts with `role = "admin"` (lost & found staff) |
  | requester | the user who created that claim |

- **Errors** always look like this:

  ```json
  { "error": { "message": "Readable message for the UI", "details": [] } }
  ```

  `details` is optional (validation problems for a 400).

  | Status | When |
  |---|---|
  | `400` | invalid input |
  | `401` | not logged in |
  | `403` | logged in but not allowed |
  | `404` | not found (or hidden from you) |
  | `409` | conflicts with the current state (e.g. item already picked up) |
  | `500` | server bug |

- **IDs** are integers. **Timestamps** are ISO-8601 UTC strings, e.g. `"2026-09-28T18:30:00.000Z"`.
- **Optional text** fields are `null` when empty, never `""`.
- **PATCH** bodies: a missing field means "don't change it", `null` means "clear it".
- **Lists** are wrapped in an object: `{ "claims": [...] }`.
  **Paged lists:** `{ "results": [...], "total": 42, "page": 1, "pageSize": 20 }`.
- **Deletes** return `204` with no body.

---

## Shared values

| Name | Values |
|---|---|
| Role | `user`, `admin` |
| Item status | `available`, `claim_pending`, `picked_up`, `disposed` |
| Claim status | `pending`, `approved`, `rejected`, `cancelled`, `completed` |
| Category | *TODO Evan/Trevor:* e.g. `water_bottle`, `phone`, `wallet`, `keys`, `id_card`, `laptop`, `headphones`, `bag`, `clothing`, … `other` |
| Color | *TODO Evan/Trevor:* e.g. `black`, `white`, `gray`, `silver`, `red`, `orange`, `yellow`, `green`, `blue`, `navy`, `purple`, `pink`, `brown`, `clear`, `multicolor` |

**Item lifecycle**

```
available ──(someone requests it)──▶ claim_pending ──(admin records pickup)──▶ picked_up
    ▲                                     │
    └──────(no open requests left)────────┘
available / claim_pending ──(hold period over, donated)──▶ disposed
```

**Claim lifecycle**

```
pending ──approve──▶ approved ──(pickup recorded)──▶ completed
   │                    │
   ├──reject──▶ rejected ◀──reject──┤
   └──cancel──▶ cancelled ◀──cancel─┘      (cancel = by the requester)
```

An **open** claim is one that is `pending` or `approved`.

---

## Common objects

### User (Jaime)

```jsonc
{
  "id": 7,
  "name": "Jaime Gutierrez",
  "email": "jaime@example.com",
  "role": "user",          // "user" | "admin"
  "locationId": null       // admins only: the desk they staff; null = all desks
}
```

Never includes the password or its hash.

### ItemSummary (Evan: fill in / adjust)

WS4 depends on at least these fields. Evan owns the final shape.

```jsonc
{
  "id": 12,
  "title": "Blue Hydro Flask 32oz",
  "category": "water_bottle",
  "color": "blue",
  "brand": "Hydro Flask",       // or null
  "status": "available",
  "foundAt": "2026-09-26T16:00:00.000Z",
  "foundWhere": "Hart gym bleachers", // or null
  "locationId": 3,
  "locationName": "John W. Hart Building",
  "photoUrl": "/uploads/abc123.jpg",  // first photo, or null
  "holdUntil": "2026-10-26T16:00:00.000Z"  // foundAt + the location's hold days
}
```

### ItemDetail (Evan)

*TODO Evan:* ItemSummary + description, all photos, full location, `hiddenDetails` (admins only).

### Location (Braden)

*TODO Braden:* id, name, building code, address, lat/lng, hours, hold days, item count…

### Claim (Jaime)

```jsonc
{
  "id": 5,
  "itemId": 12,
  "item": { /* ItemSummary */ },
  "requester": { "id": 7, "name": "Jaime Gutierrez", "email": "jaime@example.com" },
  "forFriend": true,
  "friendName": "Alex Rivera",          // null unless forFriend
  "friendContact": "alex@example.com",  // null if not given
  "message": "Blue 32oz Hydro Flask with a mountain sticker and J.J. on the lid.",
  "status": "pending",
  "adminNote": null,                     // set by an admin on approve/reject
  "reviewedBy": null,                    // { "id": 1, "name": "Front Desk" } once reviewed
  "reviewedAt": null,
  "createdAt": "2026-09-28T18:30:00.000Z",
  "itemHiddenDetails": "Initials J.J. on the lid"  // ADMINS ONLY, omitted for everyone else
}
```

Only admins and the requester can ever see a claim.

### Pickup (Jaime)

The record of who physically took an item out of the lost & found. There's at most one per item.

```jsonc
{
  "id": 3,
  "itemId": 12,
  "item": { /* ItemSummary */ },
  "claimId": 5,                    // null for a walk-in with no online request
  "pickedUpByName": "Alex Rivera", // the person at the desk (may be the requester's friend)
  "idLast4": "4821",               // last 4 letters/digits of the photo ID they showed
  "notes": null,
  "forFriend": true,               // copied from the claim; false for walk-ins
  "releasedBy": { "id": 1, "name": "Front Desk" },
  "pickedUpAt": "2026-09-29T15:10:00.000Z"
}
```

Admins only. Never store a full ID number, only the last 4.

---

## Auth (Jaime)

| Method & path | Access | Body | Success | Errors |
|---|---|---|---|---|
| `POST /api/auth/register` | public | `{ name, email, password }` | `201 { user }` + session cookie | `400` invalid · `409` email already registered |
| `POST /api/auth/login` | public | `{ email, password }` | `200 { user }` + session cookie | `400` invalid · `401` wrong email or password |
| `POST /api/auth/logout` | public | – | `204`, cookie cleared | – |
| `GET /api/auth/me` | user | – | `200 { user }` | `401` |

**Validation**

| Field | Rule |
|---|---|
| `name` | trimmed, 2–60 characters |
| `email` | valid email; trimmed and lowercased before saving/comparing |
| `password` | 8–100 characters (register); login only checks it isn't empty |

**Behavior**

- The login error is always `"Incorrect email or password"`, so it doesn't reveal which accounts exist.
- Passwords are hashed with bcrypt and never returned.
- Session length is 7 days. The cookie is httpOnly, `SameSite=Lax`, and `Secure` in production.
- Everyone who registers is a `user`. Admins are made with a server script, not an endpoint:
  `npm run make-admin -- <email> [locationId]`.
- Other workstreams protect routes with the middleware from auth:
  - `requireAuth`: 401 if not logged in
  - `requireAdmin`: 401 if not logged in, 403 if not an admin

---

## WS1 Search & browse (Evan)

*TODO Evan.* Define:

- `GET /api/items`: query parameters (`q`, `category`, `color`, `brand`, `locationId`, `status`,
  date range, `sort`, `page`, `pageSize`), defaults, and which statuses non-admins may see
  → paged list of ItemSummary.
- `GET /api/items/:id` → `{ item: ItemDetail }`. Can non-admins see picked-up or disposed items?
- Anything else the search page needs (e.g. `GET /api/items/facets` for brand autocomplete).

---

## WS2 Admin items & photos (Trevor)

*TODO Trevor.* Define:

- `POST /api/items`, `PATCH /api/items/:id`, `DELETE /api/items/:id` (admin): body fields and
  their validation, including `hiddenDetails`.
- `POST /api/items/:id/photos` (admin, multipart): field name, allowed types, size and count limits.
- `DELETE /api/items/:id/photos/:photoId` (admin).
- Where photo files live and the URL they're served from.

---

## WS3 Locations & map (Braden)

*TODO Braden.* Define:

- `GET /api/locations`, `GET /api/locations/:id` (public) → Location object(s).
- `POST`, `PATCH`, `DELETE /api/locations/:id` (admin), including what happens when deleting a
  location that still has items.

---

## WS4 Claims & pickups (Jaime)

### Endpoints

| Method & path | Access | Body | Success |
|---|---|---|---|
| `POST /api/items/:id/claims` | user | `{ message, forFriend?, friendName?, friendContact? }` | `201 { claim }` |
| `GET /api/claims/mine` | user | – | `200 { claims }`, newest first |
| `POST /api/claims/:id/cancel` | requester | – | `200 { claim }` |
| `GET /api/claims?status=pending` | admin | – | `200 { claims }`, newest first. `status` is optional (default: all). |
| `POST /api/claims/:id/approve` | admin | `{ adminNote? }` | `200 { claim }` |
| `POST /api/claims/:id/reject` | admin | `{ adminNote? }` | `200 { claim }` |
| `POST /api/items/:id/pickup` | admin | `{ pickedUpByName, idLast4, claimId?, notes? }` | `201 { pickup }` |
| `GET /api/items/:id/pickup` | admin | – | `200 { pickup }` |
| `GET /api/pickups?locationId=` | admin | – | `200 { pickups }`, newest first. `locationId` is optional. |

### Validation

| Field | Rule |
|---|---|
| `message` | required, trimmed, 10–1000 characters. The requester describes the item or proves it's theirs. |
| `forFriend` | boolean, default `false` |
| `friendName` | 2–80 characters; **required when `forFriend` is true** |
| `friendContact` | optional, up to 120 characters (email or phone) |
| `adminNote` | optional, up to 500 characters |
| `pickedUpByName` | required, 2–80 characters |
| `idLast4` | required, exactly 4 letters or digits |
| `claimId` | optional; must belong to this item and be `approved` |
| `notes` | optional, up to 500 characters |

### Rules and side effects

**Create a claim** (`POST /api/items/:id/claims`)
- The item must be `available` or `claim_pending`. Otherwise `409` ("This item is no longer in the lost & found").
- A user can have only one open claim per item. A second one gets `409`.
- Unknown item → `404`.
- Effect: an `available` item becomes `claim_pending`.

**Cancel** (requester only)
- Allowed from `pending` or `approved`. Otherwise `409`. Someone else's claim → `403`.

**Approve** (admin)
- Allowed only from `pending`. Otherwise `409`.
- Only one claim per item can be `approved` at a time. If another claim on the item is already approved → `409`.

**Reject** (admin)
- Allowed from `pending` or `approved`. Otherwise `409`.

**After a cancel or reject:** if the item has no other open claims, it goes back to `available`.

**Record a pickup** (`POST /api/items/:id/pickup`, admin)
- The item must be `available` or `claim_pending`. Otherwise `409`.
- Works with or without a claim; without one, the person is a walk-in who described the item at the desk.
- With a `claimId`: the claim must belong to this item and be `approved`, otherwise `409`. That claim becomes `completed`.
- Every other open claim on the item becomes `rejected`, with the note "Picked up by someone else".
- Effect: the item becomes `picked_up`.
- `releasedBy` is the logged-in admin. `forFriend` is copied from the claim.

**Get a pickup** (`GET /api/items/:id/pickup`)
- Returns `404` if the item has no pickup yet.

**Visibility**
- Non-admins only ever see their own claims.
- `itemHiddenDetails` appears only in admin responses.
- Pickups are admin only.

### Suggested database tables (for Trevor's migration)

```sql
claims (
  id, item_id → items, requester_id → users,
  for_friend (0/1), friend_name, friend_contact, message,
  status CHECK IN ('pending','approved','rejected','cancelled','completed'),
  admin_note, reviewed_by → users, reviewed_at, created_at
)

pickups (
  id, item_id → items UNIQUE, claim_id → claims (nullable),
  picked_up_by_name, id_last4, notes,
  released_by → users, picked_up_at
)
```
