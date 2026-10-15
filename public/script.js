// ==========================================
// FIREBASE
// ==========================================

// Everything we save (found items, lost reports, claims) lives in our
// Firebase database (Firestore), so every visitor sees the same data.
//
// Who can read what is decided by the security rules in firestore.rules:
//   - everyone can see found items (but not their private details)
//   - only logged-in employees can see private details, lost reports and claims
import {
    db,
    auth,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "./js/firebase.js";


// Public data (everyone). Filled in by loadEverything().
let foundItems = [];

// Employee-only data. Filled in by loadEmployeeData() after an employee logs in.
let lostReports = [];
let claims = [];
let itemSecrets = {};   // private details of each found item, by item id

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

    return {
        ...item,
        name: item.name || item.title || "Unnamed item",
        category: item.category || item.type || "Other",
        color: item.color || "Unknown",
        location: item.location || item.locationName || item.foundWhere || "Unknown",
        description: item.description || "No description provided.",
        icon: item.icon || "📦"
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


async function loadEmployeeData() {

    showMessage("adminLostReports", "Loading lost reports...");
    showMessage("adminClaims", "Loading claims...");

    try {

        await loadItemSecrets();
        await loadLostReports();
        await loadClaims();

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

const locationFilter =
    document.getElementById("locationFilter");


function filterItems() {

    const search =
        searchInput.value.toLowerCase();

    const category =
        categoryFilter.value;

    const location =
        locationFilter.value;


    const filtered =
        foundItems.filter(function(item) {

            const matchesSearch =
                item.name.toLowerCase().includes(search) ||
                item.description.toLowerCase().includes(search) ||
                item.color.toLowerCase().includes(search);

            const matchesCategory =
                category === "all" ||
                item.category === category;

            const matchesLocation =
                location === "all" ||
                item.location === location;


            return (
                matchesSearch &&
                matchesCategory &&
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


// ==========================================
// CLAIM MODAL
// ==========================================

const claimModal =
    document.getElementById("claimModal");

const closeModal =
    document.getElementById("closeModal");

const claimForm =
    document.getElementById("claimForm");


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


                document.getElementById(
                    "claimItemId"
                ).value = item.id;


                document.getElementById(
                    "claimItemTitle"
                ).textContent =
                    "Claim: " + item.name;


                claimForm.classList.remove("hidden");

                document.getElementById(
                    "claimSuccess"
                ).classList.add("hidden");


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

            itemName: item.name,

            email:
                document.getElementById(
                    "claimEmail"
                ).value,

            verification:
                document.getElementById(
                    "claimDescription"
                ).value,

            status: "Pending",

            createdAt: serverTimestamp()

        };


        const submitButton =
            claimForm.querySelector("button[type='submit']");

        submitButton.disabled = true;


        try {

            await addDoc(collection(db, "claims"), newClaim);

            claimForm.reset();

            claimForm.classList.add("hidden");

            document.getElementById(
                "claimSuccess"
            ).classList.remove("hidden");

            // Only employees are allowed to read claims.
            if (currentEmployee) {
                await loadClaims();
            }

        } catch (error) {

            console.error(error);

            alert("Sorry, your claim couldn't be saved. Please try again.");

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


    // claims is already sorted newest first.
    claims.forEach(function(claim) {

        // What we know about the item but never showed the public.
        const privateDetails =
            itemSecrets[claim.itemId] || "No private details on file.";

        container.innerHTML += `

            <div class="report-card">

                <h4>${escapeHtml(claim.itemName)}</h4>

                <p>
                    <strong>Status:</strong>
                    ${escapeHtml(claim.status)}
                </p>

                <p>
                    <strong>Student:</strong>
                    ${escapeHtml(claim.email)}
                </p>

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


loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        loginError.classList.add("hidden");


        const submitButton =
            loginForm.querySelector("button[type='submit']");

        submitButton.disabled = true;


        try {

            await signInWithEmailAndPassword(
                auth,
                document.getElementById("loginEmail").value,
                document.getElementById("loginPassword").value
            );

            loginForm.reset();

            // onAuthStateChanged (below) shows the dashboard.

        } catch (error) {

            console.error(error);

            if (error.code === "auth/too-many-requests") {
                showLoginError("Too many tries. Wait a few minutes and try again.");
            } else {
                showLoginError("Wrong email or password.");
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
// logs in or out.
onAuthStateChanged(auth, async function(user) {

    currentEmployee = null;


    if (user) {

        try {

            // Employees have a users/{uid} document with role "admin".
            // These are only created by hand in the Firebase console.
            const userDoc =
                await getDoc(doc(db, "users", user.uid));

            if (userDoc.exists() && userDoc.data().role === "admin") {

                currentEmployee = {
                    name: userDoc.data().name || user.email,
                    email: user.email
                };

            } else {

                showLoginError(
                    "This account isn't on the employee list. Ask the site admin to add it."
                );

                await signOut(auth);

                return;
            }

        } catch (error) {

            console.error(error);

            showLoginError("Couldn't check your account. Please try again.");

            return;
        }

    }


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
        displayLostReports();
        displayClaims();
    }

});


// ==========================================
// INITIAL PAGE LOAD
// ==========================================

loadEverything();
