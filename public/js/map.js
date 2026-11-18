import { LOCATIONS } from "./locations.js";

let map = null;
let markers = null;


export function initLocationMap(items, showItemsAtLocation) {

    if (!window.L) {
        return;
    }

    if (!map) {
        map = window.L.map("locationMap").setView([43.817056, -111.7844505], 16);

        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
    }

    if (markers) {
        markers.clearLayers();
    } else {
        markers = window.L.layerGroup().addTo(map);
    }

    LOCATIONS.forEach(function(location) {

        const itemCount =
            items.filter(function(item) {
                return item.location === location.name ||
                    item.location === location.shortName;
            }).length;

        const marker =
            window.L.marker([location.latitude, location.longitude]).addTo(markers);

        const popup =
            `<strong>${location.shortName}</strong><br>` +
            `Hours: ${location.hours}<br>` +
            `Items here: ${itemCount}<br>` +
            `<button type="button" class="map-items-btn" data-location="${location.name}">` +
            `See items here</button>`;

        marker.bindPopup(popup);

        marker.on("popupopen", function() {

            const button =
                document.querySelector(".map-items-btn");

            if (button) {
                button.addEventListener("click", function() {
                    showItemsAtLocation(location.name);
                });
            }
        });
    });

    setTimeout(function() {
        map.invalidateSize();
    }, 100);
}
