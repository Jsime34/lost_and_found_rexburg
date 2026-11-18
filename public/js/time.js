// time.js: helpers for the "time counter" (feature 3 in the master plan).
//
// Example on an item card:
//
//   import { timeCounterText } from "./js/time.js";
//   timeCounterText(item.foundAt)
//   // → "In lost & found for 3 days · 27 days left before donation"
//
// foundAt can be a Firebase Timestamp, a JavaScript Date, or date text
// like "2026-10-12T14:00:00" (some older items saved it as text).


// How long items are kept before they can be donated, until each location
// has its own number (Braden's locations.js will add holdDays per desk).
export const DEFAULT_HOLD_DAYS = 30;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;


// Turns any of the date formats above into a Date, or null if it isn't a date.
function toDate(value) {

    if (!value) {
        return null;
    }

    // Firebase Timestamp
    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}


// "1 day", "3 days", "1 hour"…
function plural(count, word) {

    return count + " " + word + (count === 1 ? "" : "s");
}


// How long the item has been in the lost & found, as text:
// "less than an hour", "5 hours", "3 days", "2 weeks", "4 months".
// Returns "" when the date is missing or not a real date.
export function timeInLostAndFound(foundAt, now = new Date()) {

    const found = toDate(foundAt);

    if (!found) {
        return "";
    }

    // Never negative (a date slightly in the future counts as "just found").
    const ms = Math.max(0, now.getTime() - found.getTime());

    const hours = Math.floor(ms / HOUR_MS);
    const days = Math.floor(ms / DAY_MS);

    if (hours < 1) {
        return "less than an hour";
    }

    if (days < 1) {
        return plural(hours, "hour");
    }

    if (days < 14) {
        return plural(days, "day");
    }

    if (days < 60) {
        return plural(Math.floor(days / 7), "week");
    }

    return plural(Math.floor(days / 30), "month");
}


// Whole days left before the item can be donated.
// 0 or less means the hold period is over. Returns null for a missing date.
export function daysLeft(foundAt, holdDays = DEFAULT_HOLD_DAYS, now = new Date()) {

    const found = toDate(foundAt);

    if (!found) {
        return null;
    }

    const holdEnds = found.getTime() + holdDays * DAY_MS;

    return Math.ceil((holdEnds - now.getTime()) / DAY_MS);
}


// The full sentence for a card:
// "In lost & found for 3 days · 27 days left before donation"
// "In lost & found for 5 weeks · hold period over"
export function timeCounterText(foundAt, holdDays = DEFAULT_HOLD_DAYS, now = new Date()) {

    const howLong = timeInLostAndFound(foundAt, now);

    if (!howLong) {
        return "";
    }

    const left = daysLeft(foundAt, holdDays, now);

    const leftText =
        left > 0
            ? plural(left, "day") + " left before donation"
            : "hold period over";

    return "In lost & found for " + howLong + " · " + leftText;
}
