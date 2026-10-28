// ==========================================
// FIREBASE
// ==========================================

// Everything we save (found items, lost reports, claims) lives in our
// Firebase database (Firestore), so every visitor sees the same data.
//
// Who can read what is decided by the security rules in firestore.rules:
//   - everyone can see found items (but not their private details)
//   - signed-in students can send claims and see their own claims
//   - only logged-in employees can see private details, lost reports and all claims
import {
    db,
    auth,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "./js/firebase.js";

// Employee actions on claims: approve, reject, record pickup (WS4).
import {
    PENDING,
    APPROVED,
    approveClaim,
    rejectClaim,
    recordPickup,
    loadPickups
} from "./js/pickups.js";


// Public data (everyone). Filled in by loadEverything().
let foundItems = [];

// Employee-only data. Filled in by loadEmployeeData() after an employee logs in.
let lostReports = [];
let claims = [];
let itemSecrets = {};   // private details of each found item, by item id
let pickups = [];       // who took each item home (pickup log)

// The signed-in account (a student with Google, or an employee), or null.
let currentUser = null;

// The signed-in student's own claims. Filled in by loadMyRequests().
let myClaims = [];

// The logged-in employee ({ name, email }), or null for visitors.
let currentEmployee = null;


// ==========================================
// SAMPLE DATA
// ==========================================

// Only used by the "Add sample items" button on the Employee page,
// which appears while the database has no items yet.
const sampleItems = [
    {
        name: "Black Backpack",
        category: "Bags",
        color: "Black",
        location: "Library",
        foundOn: "2026-09-29",
        description: "Black backpack found near the second-floor study area.",
        privateDetails: "Contains a Dell laptop with a Star Wars sticker.",
        icon: "🎒"
    },

    {
        name: "Wireless Earbuds",
        category: "Electronics",
        color: "White",
        location: "Gym",
        foundOn: "2026-09-30",
        description: "Wireless earbuds found near the basketball courts.",
        privateDetails: "Case has initials written underneath.",
        icon: "🎧"
    },

    {
        name: "Car Keys",
        category: "Keys",
        color: "Black",
        location: "Student Union",
        foundOn: "2026-09-30",
        description: "Set of vehicle keys found near the food court.",
        privateDetails: "Specific vehicle manufacturer and unique keychain.",
        icon: "🔑"
    },

    {
        name: "Water Bottle",
        category: "Other",
        color: "Blue",
        location: "Science Building",
        foundOn: "2026-09-28",
        description: "Blue insulated water bottle found in a classroom.",
        privateDetails: "Several specific stickers are attached.",
        icon: "🥤"
    },

    {
        name: "Gray Hoodie",
        category: "Clothing",
        color: "Gray",
        location: "Library",
        foundOn: "2026-09-27",
        description: "Gray hoodie found on a chair near the entrance.",
        privateDetails: "Specific university logo and size.",
        icon: "👕"
    },

    {
        name: "Smartphone",
        category: "Electronics",
        color: "Black",
        location: "Business Building",
        foundOn: "2026-09-30",
        description: "Black smartphone found in a classroom.",
        privateDetails: "Cracked corner and unique lock-screen image.",
        icon: "📱"
    }
];


// ==========================================
// HELPERS
// ==========================================

// Makes text safe to put inside HTML. Anyone can type into our forms, so
// without this someone could type HTML (or a <script>) and it would run
// on other people's screens.
function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text ?? "";

    return div.innerHTML;
}


// Turns a Firebase date into text like "September 29".
function formatDate(timestamp) {

    if (!timestamp) {
        return "Today";
    }

    // Firestore timestamps have toDate(); older/manual test records may have
    // a normal Date or a date string instead.
    const date = typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "Date unknown";
    }

    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric"
    });
}


function dateToMillis(value) {

    if (!value) {
        return 0;
    }

    if (typeof value.toMillis === "function") {
        return value.toMillis();
    }

    if (typeof value.toDate === "function") {
        return value.toDate().getTime();
    }

    const millis = new Date(value).getTime();
    return Number.isNaN(millis) ? 0 : millis;
}


// Keep the public page working if an older item uses a slightly different
// field name. The current app uses name/category/location; the planned version
// used title/type/locationName/foundWhere.
function normalizeItem(item) {

    // String(...) makes sure each field is text, so one odd item (for example
    // a number typed in the Firebase console) can't crash the search for everyone.
    return {
        ...item,
        name: String(item.name || item.title || "Unnamed item"),
        category: String(item.category || item.type || "Other"),
        color: String(item.color || "Unknown"),
        brand: String(item.brand || ""),
        location: String(item.location || item.locationName || item.foundWhere || "Unknown"),
        description: String(item.description || "No description provided."),
        icon: String(item.icon || "📦")
    };
}


// Shows a short message (like "Loading..." or an error) inside a grid.
function showMessage(elementId, message) {

    document.getElementById(elementId).innerHTML = `
        <p>${escapeHtml(message)}</p>
    `;
}


// ==========================================
// LOAD DATA FROM FIREBASE
// ==========================================

// Reads every document in a collection and returns them as a list of
// plain objects. Each object also gets its document id.
// If dateField is given, the list is sorted by it, newest first.
async function loadCollection(collectionName, dateField) {

    let whatToRead = collection(db, collectionName);

    if (dateField) {
        whatToRead = query(whatToRead, orderBy(dateField, "desc"));
    }

    const snapshot = await getDocs(whatToRead);

    // If Firebase can't be reached, getDocs quietly returns an empty
    // offline copy instead of failing. Treat that as an error so visitors
    // see "Couldn't load items" instead of "No items".
    if (snapshot.metadata.fromCache) {
        throw new Error("Couldn't reach Firebase (offline).");
    }

    return snapshot.docs.map(function(doc) {
        return { id: doc.id, ...doc.data() };
    });
}


async function loadFoundItems() {

    // Load without orderBy so records missing foundAt do not disappear from
    // the query. Sort locally and normalize records added by older versions
    // of the project.
    foundItems = (await loadCollection("items"))
        .map(normalizeItem)
        .sort(function(first, second) {
            return dateToMillis(second.foundAt) - dateToMillis(first.foundAt);
        });

    filterItems();

    displayRecentItems();

    updateStats();

    updateSampleDataBox();
}


// ----- Employee-only data -----

async function loadItemSecrets() {

    const secrets = await loadCollection("itemSecrets");

    itemSecrets = {};

    secrets.forEach(function(secret) {
        itemSecrets[secret.id] = secret.privateDetails;
    });
}


async function loadLostReports() {

    lostReports = await loadCollection("lostReports", "createdAt");

    displayLostReports();
}


async function loadClaims() {

    claims = await loadCollection("claims", "createdAt");

    displayClaims();
}


async function loadPickupLog() {

    pickups = await loadPickups();

    displayPickups();
}


async function loadEmployeeData() {

    showMessage("adminLostReports", "Loading lost reports...");
    showMessage("adminClaims", "Loading claims...");
    showMessage("adminPickups", "Loading pickups...");

    try {

        await loadItemSecrets();
        await loadLostReports();
        await loadClaims();
        await loadPickupLog();

    } catch (error) {

        console.error(error);

        showMessage(
            "adminLostReports",
            "Couldn't load lost reports. Refresh the page to try again."
        );

        showMessage(
            "adminClaims",
            "Couldn't load claims. Refresh the page to try again."
        );

        showMessage(
            "adminPickups",
            "Couldn't load the pickup log. Refresh the page to try again."
        );
    }
}


// ----- Public data (runs for every visitor when the page opens) -----

async function loadEverything() {

    showMessage("recentItems", "Loading items...");
    showMessage("foundItemsGrid", "Loading items...");

    try {

        await loadFoundItems();

    } catch (error) {

        console.error(error);

        showMessage(
            "recentItems",
            "Couldn't load items. Check your internet connection and refresh the page."
        );

        showMessage(
            "foundItemsGrid",
            "Couldn't load items. Check your internet connection and refresh the page."
        );
    }
}


// ==========================================
// PAGE NAVIGATION
// ==========================================

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-btn");
const goButtons = document.querySelectorAll("[data-go]");


function showPage(pageId) {

    pages.forEach(function(page) {
        page.classList.remove("active-page");
    });

    document.getElementById(pageId).classList.add("active-page");


    navButtons.forEach(function(button) {

        button.classList.remove("active");

        if (button.dataset.page === pageId) {
            button.classList.add("active");
        }

    });


    window.scrollTo(0, 0);
}


navButtons.forEach(function(button) {

    button.addEventListener("click", function() {
        showPage(button.dataset.page);
    });

});


goButtons.forEach(function(button) {

    button.addEventListener("click", function() {
        showPage(button.dataset.go);
    });

});


// ==========================================
// ITEM ICON
// ==========================================

function getIcon(category) {

    if (category === "Electronics") {
        return "📱";
    }

    if (category === "Bags") {
        return "🎒";
    }

    if (category === "Keys") {
        return "🔑";
    }

    if (category === "Clothing") {
        return "👕";
    }

    if (category === "Accessories") {
        return "⌚";
    }

    return "📦";
}


// ==========================================
// CREATE ITEM CARD
// ==========================================

function createItemCard(item) {

    return `
        <div class="item-card">

            <div class="item-image">
                ${escapeHtml(item.icon)}
            </div>

            <div class="item-info">

                <span class="item-category">
                    ${escapeHtml(item.category)}
                </span>

                <h3>${escapeHtml(item.name)}</h3>

                <p class="item-description">
                    ${escapeHtml(item.description)}
                </p>

                <div class="item-meta">

                    <p>
                        <strong>Color:</strong>
                        ${escapeHtml(item.color)}
                    </p>

                    <p>
                        <strong>Brand:</strong>
                        ${escapeHtml(item.brand || "Not listed")}
                    </p>

                    <p>
                        <strong>📍 Found:</strong>
                        ${escapeHtml(item.location)}
                    </p>

                    <p>
                        <strong>📅 Date:</strong>
                        ${escapeHtml(formatDate(item.foundAt))}
                    </p>

                </div>

                <button
                    class="primary-btn claim-btn"
                    data-id="${escapeHtml(item.id)}"
                >
                    This Might Be Mine
                </button>

            </div>

        </div>
    `;
}


// ==========================================
// DISPLAY FOUND ITEMS
// ==========================================

function displayFoundItems(items) {

    const grid = document.getElementById("foundItemsGrid");

    grid.innerHTML = "";


    if (items.length === 0) {

        grid.innerHTML = `
            <p>
                No items matched your search.
            </p>
        `;

        return;
    }


    items.forEach(function(item) {

        grid.innerHTML += createItemCard(item);

    });


    addClaimButtonEvents();
}


// ==========================================
// RECENT ITEMS
// ==========================================

function displayRecentItems() {

    const recentContainer =
        document.getElementById("recentItems");

    recentContainer.innerHTML = "";


    if (foundItems.length === 0) {

        recentContainer.innerHTML = `
            <p>
                No items have been turned in yet.
            </p>
        `;

        return;
    }


    // foundItems is already sorted newest first.
    const recent = foundItems.slice(0, 3);


    recent.forEach(function(item) {

        recentContainer.innerHTML += createItemCard(item);

    });


    addClaimButtonEvents();
}


// ==========================================
// SEARCH / FILTER
// ==========================================

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const colorFilter =
    document.getElementById("colorFilter");

const locationFilter =
    document.getElementById("locationFilter");


function filterItems() {

    const search =
        searchInput.value.toLowerCase();

    const category =
        categoryFilter.value;

    const color =
        colorFilter.value;

    const location =
        locationFilter.value;


    const filtered =
        foundItems.filter(function(item) {

            const matchesSearch =
                item.name.toLowerCase().includes(search) ||
                item.description.toLowerCase().includes(search) ||
                item.color.toLowerCase().includes(search) ||
                item.brand.toLowerCase().includes(search);

            const matchesCategory =
                category === "all" ||
                item.category === category;

            // Colors are typed by employees, so ignore upper/lower case
            // ("blue" = "Blue") and allow extra words ("dark blue" matches Blue).
            const matchesColor =
                color === "all" ||
                item.color.toLowerCase().includes(color.toLowerCase());

            const matchesLocation =
                location === "all" ||
                item.location === location;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesColor &&
                matchesLocation
            );

        });


    document.getElementById("resultsText").textContent =
        filtered.length + " item(s) found";


    displayFoundItems(filtered);
}


searchInput.addEventListener(
    "input",
    filterItems
);

categoryFilter.addEventListener(
    "change",
    filterItems
);

locationFilter.addEventListener(
    "change",
    filterItems
);

colorFilter.addEventListener(
    "change",
    filterItems
);


// ==========================================
// CLAIM MODAL
// ==========================================

const claimModal =
    document.getElementById("claimModal");

const closeModal =
    document.getElementById("closeModal");

const claimForm =
    document.getElementById("claimForm");

const claimSignIn =
    document.getElementById("claimSignIn");


// Students must be signed in (with Google) to claim an item.
// Shows the "Sign in with Google" box or the claim form.
function updateClaimModal() {

    if (currentUser) {

        document.getElementById("claimUserEmail").textContent =
            currentUser.email;

        claimSignIn.classList.add("hidden");
        claimForm.classList.remove("hidden");

    } else {

        claimSignIn.classList.remove("hidden");
        claimForm.classList.add("hidden");
    }
}


document.getElementById("claimSignInBtn").addEventListener(
    "click",
    function() {
        signInWithGoogle();
        // onAuthStateChanged (at the bottom) swaps in the claim form.
    }
);


// "I'm asking for a friend" checkbox: shows the friend's name and contact
// fields, and makes the name required.
const claimForFriend =
    document.getElementById("claimForFriend");

function updateFriendFields() {

    const friendFields = document.getElementById("friendFields");
    const friendName = document.getElementById("claimFriendName");

    if (claimForFriend.checked) {
        friendFields.classList.remove("hidden");
        friendName.required = true;
    } else {
        friendFields.classList.add("hidden");
        friendName.required = false;
    }
}

claimForFriend.addEventListener("change", updateFriendFields);


function addClaimButtonEvents() {

    const claimButtons =
        document.querySelectorAll(".claim-btn");


    claimButtons.forEach(function(button) {

        button.addEventListener(
            "click",
            function() {

                // Firebase document ids are text, like "aB3xQ9...".
                const itemId =
                    button.dataset.id;

                const item =
                    foundItems.find(
                        function(foundItem) {
                            return foundItem.id === itemId;
                        }
                    );


                // Start each claim with an empty form.
                claimForm.reset();
                updateFriendFields();


                document.getElementById(
                    "claimItemId"
                ).value = item.id;


                document.getElementById(
                    "claimItemTitle"
                ).textContent =
                    "Claim: " + item.name;


                document.getElementById(
                    "claimSuccess"
                ).classList.add("hidden");

                // Sign-in box or claim form, depending on who's signed in.
                updateClaimModal();


                claimModal.classList.remove("hidden");

            }
        );

    });

}


closeModal.addEventListener(
    "click",
    function() {
        claimModal.classList.add("hidden");
    }
);


claimModal.addEventListener(
    "click",
    function(event) {

        if (event.target === claimModal) {
            claimModal.classList.add("hidden");
        }

    }
);


// ==========================================
// SUBMIT CLAIM
// ==========================================

claimForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        // Signed out while the popup was open? Show the sign-in box again.
        if (!currentUser) {
            updateClaimModal();
            return;
        }


        const itemId =
            document.getElementById(
                "claimItemId"
            ).value;

        const item =
            foundItems.find(
                function(foundItem) {
                    return foundItem.id === itemId;
                }
            );


        const newClaim = {

            itemId: itemId,

            itemName: item.name.slice(0, 100),

            // Who sent it. The security rules check these match the
            // signed-in account, so nobody can claim in someone else's name.
            userId: currentUser.uid,

            userName: (currentUser.displayName || currentUser.email).slice(0, 100),

            email: currentUser.email,

            verification:
                document.getElementById(
                    "claimDescription"
                ).value,

            // "Request for a friend": the friend picks it up at the desk.
            // Empty text when it's not for a friend (the rules check this).
            forFriend: claimForFriend.checked,

            friendName: claimForFriend.checked
                ? document.getElementById("claimFriendName").value.trim()
                : "",

            friendContact: claimForFriend.checked
                ? document.getElementById("claimFriendContact").value.trim()
                : "",

            status: PENDING,

            createdAt: serverTimestamp()

        };


        const submitButton =
            claimForm.querySelector("button[type='submit']");

        submitButton.disabled = true;


        try {

            await addDoc(collection(db, "claims"), newClaim);

            claimForm.reset();
            updateFriendFields();

            claimForm.classList.add("hidden");

            document.getElementById(
                "claimSuccess"
            ).classList.remove("hidden");

            // Show it in My Requests right away.
            await loadMyRequests();

            // Only employees are allowed to read everyone's claims.
            if (currentEmployee) {
                await loadClaims();
            }

        } catch (error) {

            console.error(error);

            // The rules refuse claims on items already picked up or donated.
            if (error.code === "permission-denied") {
                alert("This item may no longer be in the lost & found. Refresh the page to see the latest list.");
            } else {
                alert("Sorry, your claim couldn't be saved. Please try again.");
            }

        } finally {

            submitButton.disabled = false;

        }

    }
);


// ==========================================
// LOST ITEM FORM
// ==========================================

const lostForm =
    document.getElementById("lostForm");


lostForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const newReport = {

            name:
                document.getElementById(
                    "lostName"
                ).value,

            category:
                document.getElementById(
                    "lostCategory"
                ).value,

            color:
                document.getElementById(
                    "lostColor"
                ).value,

            location:
                document.getElementById(
                    "lostLocation"
                ).value,

            date:
                document.getElementById(
                    "lostDate"
                ).value,

            description:
                document.getElementById(
                    "lostDescription"
                ).value,

            privateDetails:
                document.getElementById(
                    "lostPrivate"
                ).value,

            email:
                document.getElementById(
                    "lostEmail"
                ).value,

            createdAt: serverTimestamp()

        };


        const submitButton =
            lostForm.querySelector("button[type='submit']");

        submitButton.disabled = true;


        try {

            await addDoc(collection(db, "lostReports"), newReport);

            lostForm.reset();

            document.getElementById(
                "lostSuccess"
            ).classList.remove("hidden");

            // Only employees are allowed to read lost reports.
            if (currentEmployee) {
                await loadLostReports();
            }

        } catch (error) {

            console.error(error);

            alert("Sorry, your report couldn't be saved. Please try again.");

        } finally {

            submitButton.disabled = false;

        }

    }
);


// ==========================================
// EMPLOYEE ADDS FOUND ITEM
// ==========================================

// Saves a found item in two places at once:
//   items/{id}        the public part (everyone can read it)
//   itemSecrets/{id}  the private details (employees only)
// A "batch" saves both or neither, so an item is never saved half-way.
async function saveItemWithSecret(publicItem, privateDetails) {

    const batch = writeBatch(db);

    // Make a new item document so we know its id before saving.
    const itemRef = doc(collection(db, "items"));

    batch.set(itemRef, publicItem);

    batch.set(doc(db, "itemSecrets", itemRef.id), {
        privateDetails: privateDetails
    });

    await batch.commit();
}


const foundForm =
    document.getElementById("foundForm");


foundForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const category =
            document.getElementById(
                "foundCategory"
            ).value;


        // Public part: everyone can see this.
        const newItem = {

            name:
                document.getElementById(
                    "foundName"
                ).value,

            category: category,

            color:
                document.getElementById(
                    "foundColor"
                ).value,

            brand:
                document.getElementById(
                    "foundBrand"
                ).value,

            location:
                document.getElementById(
                    "foundLocation"
                ).value,

            // Firebase fills in the exact date and time when it saves.
            foundAt: serverTimestamp(),

            description:
                document.getElementById(
                    "foundPublic"
                ).value,

            icon:
                getIcon(category)

        };


        // Private part: only employees can see this (see firestore.rules).
        const privateDetails =
            document.getElementById(
                "foundPrivate"
            ).value;


        const submitButton =
            foundForm.querySelector("button[type='submit']");

        submitButton.disabled = true;


        try {

            await saveItemWithSecret(newItem, privateDetails);

            foundForm.reset();

            await loadFoundItems();

            await loadItemSecrets();

            alert("Found item successfully added.");

        } catch (error) {

            console.error(error);

            alert("Sorry, the item couldn't be saved. Please try again.");

        } finally {

            submitButton.disabled = false;

        }

    }
);


// ==========================================
// SAMPLE DATA BUTTON (EMPLOYEE PAGE)
// ==========================================

const sampleDataBox =
    document.getElementById("sampleDataBox");

const sampleDataBtn =
    document.getElementById("sampleDataBtn");


// Only show the button while there are no items, so nobody adds the
// samples twice.
function updateSampleDataBox() {

    if (foundItems.length === 0) {
        sampleDataBox.classList.remove("hidden");
    } else {
        sampleDataBox.classList.add("hidden");
    }
}


sampleDataBtn.addEventListener(
    "click",
    async function() {

        sampleDataBtn.disabled = true;


        try {

            for (const sample of sampleItems) {

                const publicItem = {
                    name: sample.name,
                    category: sample.category,
                    color: sample.color,
                    location: sample.location,
                    foundAt: Timestamp.fromDate(new Date(sample.foundOn + "T12:00:00")),
                    description: sample.description,
                    icon: sample.icon
                };

                await saveItemWithSecret(publicItem, sample.privateDetails);

            }

            await loadFoundItems();

            await loadItemSecrets();

        } catch (error) {

            console.error(error);

            alert("Sorry, the sample items couldn't be added. Please try again.");

        } finally {

            sampleDataBtn.disabled = false;

        }

    }
);


// ==========================================
// DISPLAY LOST REPORTS FOR EMPLOYEES
// ==========================================

function displayLostReports() {

    const container =
        document.getElementById(
            "adminLostReports"
        );


    container.innerHTML = "";


    if (lostReports.length === 0) {

        container.innerHTML = `
            <p>
                No lost reports yet.
            </p>
        `;

        return;
    }


    // lostReports is already sorted newest first.
    lostReports.forEach(function(report) {

            container.innerHTML += `

                <div class="report-card">

                    <h4>${escapeHtml(report.name)}</h4>

                    <p>
                        <strong>Category:</strong>
                        ${escapeHtml(report.category)}
                    </p>

                    <p>
                        <strong>Color:</strong>
                        ${escapeHtml(report.color)}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${escapeHtml(report.location)}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${escapeHtml(report.date)}
                    </p>

                    <p>
                        <strong>Student:</strong>
                        ${escapeHtml(report.email)}
                    </p>

                    <p>
                        🔒
                        <strong>Private details:</strong>
                        ${escapeHtml(report.privateDetails)}
                    </p>

                </div>

            `;

        });

}


// ==========================================
// DISPLAY CLAIMS FOR EMPLOYEES
// ==========================================

// The colored label for a claim status, e.g. "Picked up" → status-picked-up
// (colors are in styles.css). Also used by My Requests.
function statusBadge(status) {

    const statusClass =
        "status-" + String(status).toLowerCase().replace(/\s+/g, "-");

    return `
        <span class="status-badge ${escapeHtml(statusClass)}">
            ${escapeHtml(status)}
        </span>
    `;
}


// Buttons for the next step of a claim:
//   Pending  → note + Approve / Reject
//   Approved → who's picking it up + last 4 of ID → Record Pickup (or Reject)
//   Rejected / Picked up → nothing left to do
function claimActions(claim) {

    if (claim.status === PENDING) {

        return `
            <div class="claim-actions">
                <input
                    id="note-${escapeHtml(claim.id)}"
                    type="text"
                    maxlength="300"
                    placeholder="Note for the student (optional)"
                >
                <div class="action-buttons">
                    <button class="primary-btn" data-action="approve" data-claim-id="${escapeHtml(claim.id)}">
                        Approve
                    </button>
                    <button class="secondary-btn" data-action="reject" data-claim-id="${escapeHtml(claim.id)}">
                        Reject
                    </button>
                </div>
            </div>
        `;
    }

    if (claim.status === APPROVED) {

        // Usually the student picks it up; for a friend request, the friend.
        const expectedPerson =
            claim.forFriend ? claim.friendName : (claim.userName || "");

        return `
            <div class="claim-actions">
                <p class="panel-note">
                    At the desk: check their photo ID, then record the pickup.
                </p>
                <input
                    id="pickupName-${escapeHtml(claim.id)}"
                    type="text"
                    maxlength="80"
                    value="${escapeHtml(expectedPerson)}"
                    placeholder="Name of the person picking it up"
                >
                <input
                    id="pickupId-${escapeHtml(claim.id)}"
                    type="text"
                    maxlength="4"
                    placeholder="Last 4 characters of their photo ID"
                >
                <div class="action-buttons">
                    <button class="primary-btn" data-action="pickup" data-claim-id="${escapeHtml(claim.id)}">
                        Record Pickup
                    </button>
                    <button class="secondary-btn" data-action="reject" data-claim-id="${escapeHtml(claim.id)}">
                        Reject
                    </button>
                </div>
            </div>
        `;
    }

    return "";
}


function displayClaims() {

    const container =
        document.getElementById(
            "adminClaims"
        );


    container.innerHTML = "";


    if (claims.length === 0) {

        container.innerHTML = `
            <p>
                No claims yet.
            </p>
        `;

        return;
    }


    // Claims that still need work first (Pending, then Approved), then the
    // finished ones. Inside each group, newest first (claims is already).
    const order = { [PENDING]: 0, [APPROVED]: 1 };

    const sorted =
        claims.slice().sort(function(first, second) {
            return (order[first.status] ?? 2) - (order[second.status] ?? 2);
        });


    sorted.forEach(function(claim) {

        // What we know about the item but never showed the public.
        const privateDetails =
            itemSecrets[claim.itemId] || "No private details on file.";

        const friendLine = claim.forFriend
            ? `<p>
                   <strong>For a friend:</strong>
                   ${escapeHtml(claim.friendName)}${claim.friendContact ? " (" + escapeHtml(claim.friendContact) + ")" : ""}
               </p>`
            : "";

        const noteLine = claim.adminNote
            ? `<p><strong>Note:</strong> ${escapeHtml(claim.adminNote)}</p>`
            : "";

        container.innerHTML += `

            <div class="report-card">

                ${statusBadge(claim.status)}

                <h4>${escapeHtml(claim.itemName)}</h4>

                <p>
                    <strong>Student:</strong>
                    ${escapeHtml(claim.userName ? claim.userName + " (" + claim.email + ")" : claim.email)}
                </p>

                ${friendLine}

                <p>
                    <strong>Sent:</strong>
                    ${escapeHtml(formatDate(claim.createdAt))}
                </p>

                <p>
                    <strong>What they say:</strong>
                    ${escapeHtml(claim.verification)}
                </p>

                <p class="private-note">
                    🔒
                    <strong>Private details on file:</strong>
                    ${escapeHtml(privateDetails)}
                </p>

                ${noteLine}

                ${claimActions(claim)}

            </div>

        `;

    });

}


// One click listener for every claim button (Approve, Reject, Record Pickup).
// The cards are redrawn often, so we listen on the list instead of on each
// button, and read which claim from the button's data-claim-id.
document.getElementById("adminClaims").addEventListener(
    "click",
    async function(event) {

        const button = event.target.closest("button[data-action]");

        if (!button || !currentEmployee) {
            return;
        }


        const claimId = button.dataset.claimId;

        const claim =
            claims.find(function(c) {
                return c.id === claimId;
            });

        if (!claim) {
            return;
        }


        const noteInput = document.getElementById("note-" + claimId);
        const note = noteInput ? noteInput.value.trim() : "";

        button.disabled = true;


        try {

            if (button.dataset.action === "approve") {

                await approveClaim(claimId, currentEmployee.email, note);

            } else if (button.dataset.action === "reject") {

                if (!confirm("Reject this claim for " + claim.itemName + "?")) {
                    button.disabled = false;
                    return;
                }

                await rejectClaim(claimId, currentEmployee.email, note);

            } else if (button.dataset.action === "pickup") {

                const pickedUpBy =
                    document.getElementById("pickupName-" + claimId).value.trim();

                const idLast4 =
                    document.getElementById("pickupId-" + claimId).value.trim().toUpperCase();

                if (pickedUpBy.length < 2) {
                    alert("Enter the name of the person picking up the item.");
                    button.disabled = false;
                    return;
                }

                // Only the LAST 4 characters, never a full ID number (privacy).
                if (!/^[0-9A-Z]{4}$/.test(idLast4)) {
                    alert("Enter exactly 4 letters or numbers: the last 4 characters of their photo ID.");
                    button.disabled = false;
                    return;
                }

                // Any other open claims for the same item get rejected.
                const otherOpenClaims =
                    claims.filter(function(c) {
                        return c.itemId === claim.itemId &&
                            c.id !== claim.id &&
                            (c.status === PENDING || c.status === APPROVED);
                    });

                await recordPickup(
                    claim,
                    otherOpenClaims,
                    pickedUpBy,
                    idLast4,
                    currentEmployee.email
                );

                // The item is no longer in the lost & found.
                await loadFoundItems();
                await loadPickupLog();
            }

            await loadClaims();

        } catch (error) {

            console.error(error);

            alert("Sorry, that didn't save. Please try again.");

            button.disabled = false;
        }

    }
);


// ==========================================
// PICKUP LOG FOR EMPLOYEES
// ==========================================

function displayPickups() {

    const container =
        document.getElementById(
            "adminPickups"
        );


    container.innerHTML = "";


    if (pickups.length === 0) {

        container.innerHTML = `
            <p>
                No pickups recorded yet.
            </p>
        `;

        return;
    }


    // pickups is already sorted newest first.
    pickups.forEach(function(pickup) {

        const claimedBy = pickup.forFriend
            ? " (friend of " + pickup.claimedBy + ")"
            : "";

        container.innerHTML += `

            <div class="report-card">

                <h4>${escapeHtml(pickup.itemName)}</h4>

                <p>
                    <strong>Picked up by:</strong>
                    ${escapeHtml(pickup.pickedUpByName + claimedBy)}
                </p>

                <p>
                    <strong>ID (last 4):</strong>
                    ${escapeHtml(pickup.idLast4)}
                </p>

                <p>
                    <strong>Released by:</strong>
                    ${escapeHtml(pickup.releasedBy)}
                </p>

                <p>
                    <strong>When:</strong>
                    ${escapeHtml(formatDate(pickup.pickedUpAt))}
                </p>

            </div>

        `;

    });

}


// ==========================================
// UPDATE HOME PAGE STATISTICS
// ==========================================

// Only uses public data (found items), so it works for every visitor.
function updateStats() {

    document.getElementById(
        "foundCount"
    ).textContent = foundItems.length;


    const oneWeekAgo =
        Date.now() - 7 * 24 * 60 * 60 * 1000;

    const foundThisWeek =
        foundItems.filter(function(item) {
            return dateToMillis(item.foundAt) >= oneWeekAgo;
        });

    document.getElementById(
        "weekCount"
    ).textContent = foundThisWeek.length;


    // Count each place only once, even if it has several items.
    const places =
        new Set(
            foundItems.map(function(item) {
                return item.location;
            })
        );

    document.getElementById(
        "placesCount"
    ).textContent = places.size;

}


// ==========================================
// STUDENT SIGN IN (GOOGLE) + MY REQUESTS
// ==========================================

// Opens Google's sign-in window. When it works, onAuthStateChanged
// (at the bottom of this file) updates the page.
async function signInWithGoogle() {

    try {

        await signInWithPopup(auth, new GoogleAuthProvider());

    } catch (error) {

        // The student closed the window: nothing to report.
        if (error.code === "auth/popup-closed-by-user" ||
            error.code === "auth/cancelled-popup-request") {
            return;
        }

        console.error(error);

        if (error.code === "auth/popup-blocked") {
            alert("Your browser blocked the sign-in window. Allow pop-ups for this site and try again.");
        } else if (error.code === "auth/operation-not-allowed") {
            alert("Google sign-in isn't turned on for this site yet.");
        } else if (error.code === "auth/unauthorized-domain") {
            alert("This website address isn't allowed to sign in yet (Firebase console → Authentication → Settings → Authorized domains).");
        } else {
            alert("Sorry, sign-in didn't work. Please try again.");
        }
    }
}


document.getElementById("googleSignInBtn").addEventListener(
    "click",
    signInWithGoogle
);

document.getElementById("requestsSignInBtn").addEventListener(
    "click",
    signInWithGoogle
);

document.getElementById("signOutBtn").addEventListener(
    "click",
    function() {
        signOut(auth);
    }
);


// Header: "Sign in with Google" button, or "Hi, Name · Sign out".
function updateAuthArea() {

    const signInButton = document.getElementById("googleSignInBtn");
    const signedInBox = document.getElementById("signedInBox");

    if (currentUser) {

        // First name: from the employee list, the Google account, or the
        // part of the email before the @.
        const fullName =
            (currentEmployee && currentEmployee.name) ||
            currentUser.displayName ||
            currentUser.email.split("@")[0];

        document.getElementById("signedInName").textContent =
            fullName.split("@")[0].split(" ")[0];

        signInButton.classList.add("hidden");
        signedInBox.classList.remove("hidden");

    } else {

        signedInBox.classList.add("hidden");
        signInButton.classList.remove("hidden");
    }
}


// Loads only the signed-in student's claims. The security rules don't
// let anyone read other people's claims.
async function loadMyRequests() {

    if (!currentUser) {
        myClaims = [];
        displayMyRequests();
        return;
    }

    showMessage("myRequests", "Loading your requests...");

    try {

        const mine =
            query(
                collection(db, "claims"),
                where("userId", "==", currentUser.uid)
            );

        const snapshot = await getDocs(mine);

        if (snapshot.metadata.fromCache) {
            throw new Error("Couldn't reach Firebase (offline).");
        }

        // Newest first. (Sorted here so Firebase doesn't need an extra index.)
        myClaims = snapshot.docs
            .map(function(doc) {
                return { id: doc.id, ...doc.data() };
            })
            .sort(function(first, second) {
                return dateToMillis(second.createdAt) - dateToMillis(first.createdAt);
            });

        displayMyRequests();

    } catch (error) {

        console.error(error);

        document.getElementById("requestsSignIn").classList.add("hidden");
        document.getElementById("myRequests").classList.remove("hidden");

        showMessage(
            "myRequests",
            "Couldn't load your requests. Refresh the page to try again."
        );
    }
}


// A short explanation for each claim status.
function statusMessage(status, forFriend) {

    if (status === "Pending") {
        return "An employee will compare your description with the item.";
    }

    if (status === "Approved" && forFriend) {
        return "Approved! Your friend can pick it up at the lost & found desk with a photo ID.";
    }

    if (status === "Approved") {
        return "Approved! Bring a photo ID to the lost & found desk to pick it up.";
    }

    if (status === "Rejected") {
        return "This request wasn't approved. Contact the lost & found desk if you have questions.";
    }

    if (status === "Picked up") {
        return "This item was picked up.";
    }

    return "";
}


function displayMyRequests() {

    const signInBox = document.getElementById("requestsSignIn");
    const list = document.getElementById("myRequests");


    if (!currentUser) {

        signInBox.classList.remove("hidden");
        list.classList.add("hidden");
        list.innerHTML = "";

        return;
    }


    signInBox.classList.add("hidden");
    list.classList.remove("hidden");


    if (myClaims.length === 0) {

        list.innerHTML = `
            <p>
                You haven't claimed any items yet. Find yours under
                <strong>Found Items</strong> and press "This Might Be Mine".
            </p>
        `;

        return;
    }


    list.innerHTML = "";

    myClaims.forEach(function(claim) {

        const friendLine = claim.forFriend
            ? `<p><strong>For your friend:</strong> ${escapeHtml(claim.friendName)}</p>`
            : "";

        const noteLine = claim.adminNote
            ? `<p><strong>Note from the desk:</strong> ${escapeHtml(claim.adminNote)}</p>`
            : "";

        list.innerHTML += `

            <div class="report-card">

                ${statusBadge(claim.status)}

                <h4>${escapeHtml(claim.itemName)}</h4>

                ${friendLine}

                <p>
                    <strong>Sent:</strong>
                    ${escapeHtml(formatDate(claim.createdAt))}
                </p>

                <p>
                    <strong>What you said:</strong>
                    ${escapeHtml(claim.verification)}
                </p>

                ${noteLine}

                <p class="status-note">
                    ${escapeHtml(statusMessage(claim.status, claim.forFriend))}
                </p>

            </div>

        `;

    });
}


// ==========================================
// EMPLOYEE LOG IN / LOG OUT
// ==========================================

const employeeLogin =
    document.getElementById("employeeLogin");

const employeeDashboard =
    document.getElementById("employeeDashboard");

const loginForm =
    document.getElementById("loginForm");

const loginError =
    document.getElementById("loginError");


function showLoginError(message) {

    loginError.textContent = message;

    loginError.classList.remove("hidden");
}


// Employees have a users/{uid} document with role "admin". These are
// only created by hand in the Firebase console.
// Returns { name, email } for employees, or null for everyone else.
async function getEmployeeProfile(user) {

    const userDoc =
        await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists() && userDoc.data().role === "admin") {

        return {
            name: userDoc.data().name || user.email,
            email: user.email
        };
    }

    return null;
}


loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        loginError.classList.add("hidden");


        const submitButton =
            loginForm.querySelector("button[type='submit']");

        submitButton.disabled = true;


        try {

            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    document.getElementById("loginEmail").value,
                    document.getElementById("loginPassword").value
                );

            loginForm.reset();

            // A real account, but not an employee: don't keep it signed in here.
            const employee =
                await getEmployeeProfile(credential.user);

            if (!employee) {

                showLoginError(
                    "This account isn't on the employee list. Ask the site admin to add it."
                );

                await signOut(auth);
            }

            // For employees, onAuthStateChanged (below) shows the dashboard.

        } catch (error) {

            console.error(error);

            if (error.code === "auth/too-many-requests") {
                showLoginError("Too many tries. Wait a few minutes and try again.");
            } else if (error.code === "auth/unauthorized-domain") {
                showLoginError("This website address isn't allowed to log in yet (Firebase console → Authentication → Settings → Authorized domains).");
            } else if (error.code === "auth/network-request-failed") {
                showLoginError("Couldn't reach Firebase. Check your internet connection.");
            } else if (String(error.code).startsWith("auth/")) {
                showLoginError("Wrong email or password.");
            } else {
                showLoginError("Couldn't check your account. Please try again.");
            }

        } finally {

            submitButton.disabled = false;

        }

    }
);


document.getElementById("logoutBtn").addEventListener(
    "click",
    function() {
        signOut(auth);
    }
);


// Firebase calls this when the page opens and every time someone
// signs in or out (students with Google, employees with email + password).
onAuthStateChanged(auth, async function(user) {

    currentUser = user;
    currentEmployee = null;


    if (user) {

        try {

            currentEmployee = await getEmployeeProfile(user);

        } catch (error) {

            // Couldn't check: treat them as a student for now.
            console.error(error);
        }

    }


    // Student parts of the page: header, claim popup, My Requests.
    updateAuthArea();
    updateClaimModal();
    await loadMyRequests();


    // Employee parts of the page.
    if (currentEmployee) {

        document.getElementById("employeeName").textContent =
            currentEmployee.name;

        employeeLogin.classList.add("hidden");
        employeeDashboard.classList.remove("hidden");

        await loadEmployeeData();

    } else {

        employeeDashboard.classList.add("hidden");
        employeeLogin.classList.remove("hidden");

        // Forget employee-only data so it doesn't stay on the screen.
        lostReports = [];
        claims = [];
        itemSecrets = {};
        pickups = [];
        displayLostReports();
        displayClaims();
        displayPickups();
    }

});


// ==========================================
// INITIAL PAGE LOAD
// ==========================================

loadEverything();
