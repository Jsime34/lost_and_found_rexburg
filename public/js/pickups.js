// pickups.js: what employees do with claims (WS4).
//   - approve or reject a claim
//   - record who picked an item up (features 5 and 6 in the master plan)
//   - load the pickup log
//
// Only database work lives here. The buttons and lists that call these
// functions are in script.js ("DISPLAY CLAIMS FOR EMPLOYEES").
// The security rules only let employees do any of this.

import {
    db,
    collection,
    doc,
    getDocs,
    updateDoc,
    writeBatch,
    query,
    orderBy,
    serverTimestamp
} from "./firebase.js";


// Claim statuses (also shown to students under My Requests).
export const PENDING = "Pending";
export const APPROVED = "Approved";
export const REJECTED = "Rejected";
export const PICKED_UP = "Picked up";


// Marks a claim as approved. The student sees it in My Requests.
export async function approveClaim(claimId, employeeEmail, note) {

    await updateDoc(doc(db, "claims", claimId), {
        status: APPROVED,
        adminNote: note,
        reviewedBy: employeeEmail,
        reviewedAt: serverTimestamp()
    });
}


// Marks a claim as rejected, with an optional note for the student.
export async function rejectClaim(claimId, employeeEmail, note) {

    await updateDoc(doc(db, "claims", claimId), {
        status: REJECTED,
        adminNote: note,
        reviewedBy: employeeEmail,
        reviewedAt: serverTimestamp()
    });
}


// Records that someone took the item home. In ONE batch (all or nothing):
//   1. saves a pickups document (the theft-control record)
//   2. marks the claim "Picked up"
//   3. marks the item "picked_up"
//   4. rejects any other open claims for the same item
export async function recordPickup(claim, otherOpenClaims, pickedUpByName, idLast4, employeeEmail) {

    const batch = writeBatch(db);

    batch.set(doc(collection(db, "pickups")), {
        itemId: claim.itemId,
        itemName: claim.itemName,
        claimId: claim.id,
        claimedBy: claim.userName || claim.email,
        forFriend: claim.forFriend === true,
        pickedUpByName: pickedUpByName,
        idLast4: idLast4,
        releasedBy: employeeEmail,
        pickedUpAt: serverTimestamp()
    });

    batch.update(doc(db, "claims", claim.id), {
        status: PICKED_UP,
        reviewedBy: employeeEmail,
        reviewedAt: serverTimestamp()
    });

    batch.update(doc(db, "items", claim.itemId), {
        status: "picked_up"
    });

    otherOpenClaims.forEach(function(other) {

        batch.update(doc(db, "claims", other.id), {
            status: REJECTED,
            adminNote: "Someone else picked this item up.",
            reviewedBy: employeeEmail,
            reviewedAt: serverTimestamp()
        });
    });

    await batch.commit();
}


// Every pickup, newest first.
export async function loadPickups() {

    const snapshot =
        await getDocs(
            query(collection(db, "pickups"), orderBy("pickedUpAt", "desc"))
        );

    // Firebase quietly returns an empty offline copy when it can't be reached.
    if (snapshot.metadata.fromCache) {
        throw new Error("Couldn't reach Firebase (offline).");
    }

    return snapshot.docs.map(function(pickupDoc) {
        return { id: pickupDoc.id, ...pickupDoc.data() };
    });
}
