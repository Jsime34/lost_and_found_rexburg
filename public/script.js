// ==========================================
// FIREBASE
// ==========================================

// Everything we save (found items, lost reports, claims) lives in our
// Firebase database (Firestore), so every visitor sees the same data.
import {
    db,
    collection,
    getDocs,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp
} from "./js/firebase.js";


// The data loaded from Firebase. Filled in by loadEverything().
let foundItems = [];
let lostReports = [];
let claims = [];


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

    return timestamp.toDate().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric"
    });
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

// Reads every document in a collection, newest first, and returns them
// as a list of plain objects. Each object also gets its document id.
async function loadCollection(collectionName, dateField) {

    const newestFirst =
        query(
            collection(db, collectionName),
            orderBy(dateField, "desc")
        );

    const snapshot = await getDocs(newestFirst);

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

    foundItems = await loadCollection("items", "foundAt");

    filterItems();

    displayRecentItems();

    updateStats();

    updateSampleDataBox();
}


async function loadLostReports() {

    lostReports = await loadCollection("lostReports", "createdAt");

    displayLostReports();

    updateStats();
}


async function loadClaims() {

    claims = await loadCollection("claims", "createdAt");

    updateStats();
}


async function loadEverything() {

    showMessage("recentItems", "Loading items...");
    showMessage("foundItemsGrid", "Loading items...");

    try {

        await loadFoundItems();
        await loadLostReports();
        await loadClaims();

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

            await loadClaims();

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

            await loadLostReports();

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

            privateDetails:
                document.getElementById(
                    "foundPrivate"
                ).value,

            icon:
                getIcon(category)

        };


        const submitButton =
            foundForm.querySelector("button[type='submit']");

        submitButton.disabled = true;


        try {

            await addDoc(collection(db, "items"), newItem);

            foundForm.reset();

            await loadFoundItems();

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

                await addDoc(collection(db, "items"), {

                    name: sample.name,
                    category: sample.category,
                    color: sample.color,
                    location: sample.location,
                    foundAt: Timestamp.fromDate(new Date(sample.foundOn + "T12:00:00")),
                    description: sample.description,
                    privateDetails: sample.privateDetails,
                    icon: sample.icon

                });

            }

            await loadFoundItems();

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
// UPDATE HOME PAGE STATISTICS
// ==========================================

function updateStats() {

    document.getElementById(
        "foundCount"
    ).textContent = foundItems.length;


    document.getElementById(
        "lostCount"
    ).textContent = lostReports.length;


    const pendingClaims =
        claims.filter(function(claim) {
            return claim.status === "Pending";
        });

    document.getElementById(
        "claimCount"
    ).textContent = pendingClaims.length;

}


// ==========================================
// INITIAL PAGE LOAD
// ==========================================

loadEverything();
