import {
    db,
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "./firebase.js";

const itemMessage = document.getElementById("itemMessage");
const itemDetails = document.getElementById("itemDetails");
const pageHeading = document.getElementById("pageHeading");

function text(value) {
    return value === undefined || value === null ? "" : String(value).trim();
}

function escapeHtml(value) {
    return text(value).replace(/[&<>'"]/g, function(character) {
        return {
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            "'": "&#39;", '"': "&quot;"
        }[character];
    });
}

function dateValue(value) {
    if (!value) return 0;
    if (typeof value.toDate === "function") return value.toDate().getTime();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function dateText(value) {
    const time = dateValue(value);
    return time ? new Date(time).toLocaleDateString() : "Not listed";
}

function daysInLostAndFound(value) {
    const time = dateValue(value);
    if (!time) return "Time in lost and found is unavailable.";
    const days = Math.max(0, Math.floor((Date.now() - time) / 86400000));
    return `${days} day${days === 1 ? "" : "s"}`;
}

function normalizeItem(snapshot) {
    const data = snapshot.data();
    return {
        id: snapshot.id,
        title: text(data.title || data.name || "Untitled item"),
        type: text(data.type || data.category),
        color: text(data.color),
        brand: text(data.brand),
        description: text(data.description),
        foundWhere: text(data.foundWhere || data.location),
        locationName: text(data.locationName || data.location),
        locationId: text(data.locationId),
        foundAt: data.foundAt || data.foundOn,
        photo: text(data.photo),
        status: text(data.status || "available")
    };
}

async function loadLocation(item) {
    if (item.locationId) {
        const locationSnapshot = await getDoc(doc(db, "locations", item.locationId));
        return locationSnapshot.exists() ? locationSnapshot.data() : null;
    }

    if (!item.locationName) return null;
    const locationQuery = query(
        collection(db, "locations"),
        where("name", "==", item.locationName)
    );
    const snapshot = await getDocs(locationQuery);
    return snapshot.empty ? null : snapshot.docs[0].data();
}

function renderItem(item, location) {
    const image = item.photo
        ? `<img src="${escapeHtml(item.photo)}" alt="Photo of ${escapeHtml(item.title)}">`
        : "📦";
    const locationName = item.locationName || item.foundWhere || "Not listed";
    const hours = location && location.hours ? location.hours : "Hours not listed yet";
    const mapLink = `map.html?location=${encodeURIComponent(locationName)}`;
    const requestLink = `request.html?item=${encodeURIComponent(item.id)}`;
    const unavailable = item.status !== "available";

    pageHeading.textContent = item.title;
    itemDetails.innerHTML = `
        <div class="item-details-photo">${image}</div>
        <div>
            <span class="item-category">${escapeHtml(item.type || "Found item")}</span>
            <h2>${escapeHtml(item.title)}</h2>
            <p>${escapeHtml(item.description || "No public description was provided.")}</p>
            <ul class="detail-list">
                <li><strong>Color:</strong> ${escapeHtml(item.color || "Not listed")}</li>
                <li><strong>Brand:</strong> ${escapeHtml(item.brand || "Not listed")}</li>
                <li><strong>Found at:</strong> ${escapeHtml(locationName)}</li>
                <li><strong>Date found:</strong> ${escapeHtml(dateText(item.foundAt))}</li>
                <li><strong>Held for:</strong> ${escapeHtml(daysInLostAndFound(item.foundAt))}</li>
                <li><strong>Location hours:</strong> ${escapeHtml(hours)}</li>
                <li><strong>Status:</strong> ${escapeHtml(item.status)}</li>
            </ul>
            <div class="item-actions">
                <a class="primary-btn${unavailable ? " hidden" : ""}" href="${requestLink}">Request this item</a>
                <a class="secondary-btn" href="${mapLink}">View location map</a>
            </div>
        </div>`;

    itemMessage.classList.add("hidden");
    itemDetails.classList.remove("hidden");
}

async function loadItem() {
    const itemId = new URLSearchParams(window.location.search).get("id");
    if (!itemId) throw new Error("No item was selected.");

    const snapshot = await getDoc(doc(db, "items", itemId));
    if (!snapshot.exists()) throw new Error("That item could not be found.");

    const item = normalizeItem(snapshot);
    const location = await loadLocation(item);
    renderItem(item, location);
}

loadItem().catch(function(error) {
    console.error(error);
    pageHeading.textContent = "Item unavailable";
    itemMessage.textContent = error.message || "Could not load this item.";
});
