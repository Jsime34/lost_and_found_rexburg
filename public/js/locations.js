// Real campus lost & found locations. The official BYU-Idaho office is
// Rigby Hall 144, and items are held for 60 days.
export const LOCATIONS = [
    {
        name: "Rigby Hall",
        shortName: "Rigby Hall 144",
        latitude: 43.817056,
        longitude: -111.7844505,
        hours: "Monday-Friday, 8:00 AM-5:00 PM",
        holdDays: 60
    }
];


export function getLocationHoldDays(locationName) {

    const location =
        LOCATIONS.find(function(item) {
            return item.name === locationName ||
                item.shortName === locationName;
        });

    return location ? location.holdDays : 60;
}
