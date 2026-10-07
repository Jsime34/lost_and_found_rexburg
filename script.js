// ==========================================
// SAMPLE DATA
// ==========================================

let foundItems = [
    {
        id: 1,
        name: "Black Backpack",
        category: "Bags",
        color: "Black",
        location: "Library",
        date: "September 29",
        description: "Black backpack found near the second-floor study area.",
        privateDetails: "Contains a Dell laptop with a Star Wars sticker.",
        icon: "🎒"
    },

    {
        id: 2,
        name: "Wireless Earbuds",
        category: "Electronics",
        color: "White",
        location: "Gym",
        date: "September 30",
        description: "Wireless earbuds found near the basketball courts.",
        privateDetails: "Case has initials written underneath.",
        icon: "🎧"
    },

    {
        id: 3,
        name: "Car Keys",
        category: "Keys",
        color: "Black",
        location: "Student Union",
        date: "September 30",
        description: "Set of vehicle keys found near the food court.",
        privateDetails: "Specific vehicle manufacturer and unique keychain.",
        icon: "🔑"
    },

    {
        id: 4,
        name: "Water Bottle",
        category: "Other",
        color: "Blue",
        location: "Science Building",
        date: "September 28",
        description: "Blue insulated water bottle found in a classroom.",
        privateDetails: "Several specific stickers are attached.",
        icon: "🥤"
    },

    {
        id: 5,
        name: "Gray Hoodie",
        category: "Clothing",
        color: "Gray",
        location: "Library",
        date: "September 27",
        description: "Gray hoodie found on a chair near the entrance.",
        privateDetails: "Specific university logo and size.",
        icon: "👕"
    },

    {
        id: 6,
        name: "Smartphone",
        category: "Electronics",
        color: "Black",
        location: "Business Building",
        date: "September 30",
        description: "Black smartphone found in a classroom.",
        privateDetails: "Cracked corner and unique lock-screen image.",
        icon: "📱"
    }
];


let lostReports = [
    {
        id: 1,
        name: "Backpack",
        category: "Bags",
        color: "Black",
        location: "Library",
        date: "2026-09-29",
        description: "Black school backpack.",
        privateDetails: "Contains my laptop and red notebook.",
        email: "sarah@university.edu"
    },

    {
        id: 2,
        name: "Keys",
        category: "Keys",
        color: "Black",
        location: "Student Union",
        date: "2026-09-30",
        description: "Car keys on a key ring.",
        privateDetails: "Vehicle brand and a unique keychain.",
        email: "jordan@university.edu"
    }
];


let claims = [];


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
                ${item.icon}
            </div>

            <div class="item-info">

                <span class="item-category">
                    ${item.category}
                </span>

                <h3>${item.name}</h3>

                <p class="item-description">
                    ${item.description}
                </p>

                <div class="item-meta">

                    <p>
                        <strong>Color:</strong>
                        ${item.color}
                    </p>

                    <p>
                        <strong>📍 Found:</strong>
                        ${item.location}
                    </p>

                    <p>
                        <strong>📅 Date:</strong>
                        ${item.date}
                    </p>

                </div>

                <button
                    class="primary-btn claim-btn"
                    data-id="${item.id}"
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

                const itemId =
                    Number(button.dataset.id);

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
    function(event) {

        event.preventDefault();


        const newClaim = {

            itemId:
                Number(
                    document.getElementById(
                        "claimItemId"
                    ).value
                ),

            email:
                document.getElementById(
                    "claimEmail"
                ).value,

            verification:
                document.getElementById(
                    "claimDescription"
                ).value,

            status: "Pending"

        };


        claims.push(newClaim);


        claimForm.reset();

        claimForm.classList.add("hidden");

        document.getElementById(
            "claimSuccess"
        ).classList.remove("hidden");


        updateStats();

    }
);


// ==========================================
// LOST ITEM FORM
// ==========================================

const lostForm =
    document.getElementById("lostForm");


lostForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const newReport = {

            id: Date.now(),

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
                ).value

        };


        lostReports.push(newReport);


        lostForm.reset();


        document.getElementById(
            "lostSuccess"
        ).classList.remove("hidden");


        displayLostReports();

        updateStats();

    }
);


// ==========================================
// EMPLOYEE ADDS FOUND ITEM
// ==========================================

const foundForm =
    document.getElementById("foundForm");


foundForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const category =
            document.getElementById(
                "foundCategory"
            ).value;


        const newItem = {

            id: Date.now(),

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

            date:
                new Date().toLocaleDateString(),

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


        foundItems.unshift(newItem);


        foundForm.reset();


        displayFoundItems(foundItems);

        displayRecentItems();

        updateStats();


        alert("Found item successfully added.");

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


    lostReports
        .slice()
        .reverse()
        .forEach(function(report) {

            container.innerHTML += `

                <div class="report-card">

                    <h4>${report.name}</h4>

                    <p>
                        <strong>Category:</strong>
                        ${report.category}
                    </p>

                    <p>
                        <strong>Color:</strong>
                        ${report.color}
                    </p>

                    <p>
                        <strong>Location:</strong>
                        ${report.location}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${report.date}
                    </p>

                    <p>
                        <strong>Student:</strong>
                        ${report.email}
                    </p>

                    <p>
                        🔒
                        <strong>Private details:</strong>
                        ${report.privateDetails}
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


    document.getElementById(
        "claimCount"
    ).textContent = claims.length;

}


// ==========================================
// INITIAL PAGE LOAD
// ==========================================

displayFoundItems(foundItems);

displayRecentItems();

displayLostReports();

updateStats();