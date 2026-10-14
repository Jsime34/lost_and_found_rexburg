import {
    db,
    collection,
    getDocs
} from "./firebase.js";

const state = {
    items: [],
    filteredItems: []
};

const form = document.getElementById("searchForm");
const keywordSearch = document.getElementById("keywordSearch");
const typeFilter = document.getElementById("typeFilter");
const colorFilter = document.getElementById("colorFilter");
const brandFilter = document.getElementById("brandFilter");
const locationFilter = document.getElementById("locationFilter");
const sortOrder = document.getElementById("sortOrder");
const resultsText = document.getElementById("resultsText");
const resultsGrid = document.getElementById("resultsGrid");
const searchMessage = document.getElementById("searchMessage");

function text(value) {
    return value === undefined || value === null ? "" : String(value).trim();
}

function escapeHtml(value) {
    return text(value).replace(/[&<>'"]/g, function(character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        }[character];
    });
}

function getDateValue(value) {
    if (!value) return 0;
    if (typeof value.toDate === "function") return value.toDate().getTime();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getDateText(value) {
    const time = getDateValue(value);
    if (!time) return "Date not available";
    return new Date(time).toLocaleDateString();
}

// Supports the master-plan field names and the older prototype field names.
function normalizeItem(documentSnapshot) {
    const data = documentSnapshot.data();
    return {
        id: documentSnapshot.id,
        title: text(data.title || data.name || "Untitled item"),
        type: text(data.type || data.category),
        color: text(data.color),
        brand: text(data.brand),
        description: text(data.description),
        foundWhere: text(data.foundWhere || data.location),
        locationName: text(data.locationName || data.location),
        foundAt: data.foundAt || data.foundOn,
        photo: text(data.photo),
        status: text(data.status || "available")
    };
}

function isAvailable(item) {
    return !item.status || item.status === "available";
}

function addFilterOptions(select, values) {
    const original = select.options[0];
    select.replaceChildren(original);

    values.filter(Boolean).sort(function(a, b) {
        return a.localeCompare(b);
    }).forEach(function(value) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.append(option);
    });
}

function fillFilters() {
    addFilterOptions(typeFilter, state.items.map(function(item) { return item.type; }));
    addFilterOptions(colorFilter, state.items.map(function(item) { return item.color; }));
    addFilterOptions(brandFilter, state.items.map(function(item) { return item.brand; }));
    addFilterOptions(locationFilter, state.items.map(function(item) { return item.locationName; }));

    const locationFromUrl = new URLSearchParams(window.location.search).get("location");
    if (locationFromUrl) locationFilter.value = locationFromUrl;
}

function matches(item) {
    const words = keywordSearch.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const searchableText = [
        item.title,
        item.type,
        item.color,
        item.brand,
        item.description,
        item.foundWhere,
        item.locationName
    ].join(" ").toLowerCase();

    return words.every(function(word) { return searchableText.includes(word); }) &&
        (!typeFilter.value || item.type === typeFilter.value) &&
        (!colorFilter.value || item.color === colorFilter.value) &&
        (!brandFilter.value || item.brand === brandFilter.value) &&
        (!locationFilter.value || item.locationName === locationFilter.value);
}

function renderItem(item) {
    const visual = item.photo
        ? `<img src="${escapeHtml(item.photo)}" alt="Photo of ${escapeHtml(item.title)}">`
        : "📦";

    return `
        <article class="item-card">
            <div class="item-image">${visual}</div>
            <div class="item-info">
                <span class="item-category">${escapeHtml(item.type || "Found item")}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p class="item-description">${escapeHtml(item.description || "No public description.")}</p>
                <div class="item-meta">
                    <p><strong>Color:</strong> ${escapeHtml(item.color || "Not listed")}</p>
                    <p><strong>Brand:</strong> ${escapeHtml(item.brand || "Not listed")}</p>
                    <p><strong>Found at:</strong> ${escapeHtml(item.locationName || item.foundWhere || "Not listed")}</p>
                    <p><strong>Date found:</strong> ${escapeHtml(getDateText(item.foundAt))}</p>
                </div>
                <a class="primary-btn" href="item.html?id=${encodeURIComponent(item.id)}">View item</a>
            </div>
        </article>`;
}

function renderResults() {
    state.filteredItems = state.items.filter(matches).sort(function(a, b) {
        const difference = getDateValue(a.foundAt) - getDateValue(b.foundAt);
        return sortOrder.value === "oldest" ? difference : -difference;
    });

    resultsGrid.innerHTML = state.filteredItems.map(renderItem).join("");
    resultsText.textContent = `${state.filteredItems.length} item${state.filteredItems.length === 1 ? "" : "s"} found`;
    searchMessage.classList.toggle("hidden", state.filteredItems.length !== 0);
    searchMessage.textContent = state.filteredItems.length === 0
        ? "No items match those filters. Try a different search."
        : "";
}

async function loadItems() {
    resultsText.textContent = "Loading items...";
    searchMessage.classList.add("hidden");

    try {
        const snapshot = await getDocs(collection(db, "items"));
        state.items = snapshot.docs.map(normalizeItem).filter(isAvailable);
        fillFilters();
        renderResults();
    } catch (error) {
        console.error(error);
        resultsText.textContent = "Could not load items.";
        resultsGrid.replaceChildren();
        searchMessage.textContent = "There was a problem connecting to the lost-and-found database. Please try again later.";
        searchMessage.classList.remove("hidden");
    }
}

form.addEventListener("submit", function(event) {
    event.preventDefault();
    renderResults();
});

[keywordSearch, typeFilter, colorFilter, brandFilter, locationFilter, sortOrder].forEach(function(control) {
    control.addEventListener("input", renderResults);
    control.addEventListener("change", renderResults);
});

document.getElementById("clearSearch").addEventListener("click", function() {
    form.reset();
    renderResults();
});

loadItems();
