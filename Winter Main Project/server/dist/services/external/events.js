"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchEvents = exports.fetchActivities = void 0;
const env_1 = require("../../config/env");
const mockActivities = [
    {
        id: "act1",
        name: "Tsukiji Night Bites Tour",
        category: "Food",
        durationHours: 3,
        latitude: 35.665,
        longitude: 139.7708,
        description: "Sample late-night ramen and seafood classics.",
    },
    {
        id: "act2",
        name: "Neon District Photo Walk",
        category: "Nightlife",
        durationHours: 2,
        latitude: 35.6595,
        longitude: 139.7005,
        description: "Capture the iconic Shibuya crossing with a guide.",
    },
];
const mockEvents = [
    {
        id: "evt1",
        name: "Tokyo Jazz Collective",
        venue: "Blue Note",
        date: "2025-03-13T19:30:00Z",
        link: "https://example.com/events/blue-note",
    },
    {
        id: "evt2",
        name: "Spring Hanami Picnic",
        venue: "Ueno Park",
        date: "2025-03-15T10:00:00Z",
    },
];
const fetchActivities = async ({ destination, interests, }) => {
    if (!env_1.env.EVENTS_API_KEY) {
        return mockActivities.filter((activity) => interests.length ? interests.includes(activity.category) : true);
    }
    return mockActivities;
};
exports.fetchActivities = fetchActivities;
const fetchEvents = async ({ destination, interests, }) => {
    if (!env_1.env.EVENTS_API_KEY) {
        return mockEvents;
    }
    return mockEvents;
};
exports.fetchEvents = fetchEvents;
//# sourceMappingURL=events.js.map