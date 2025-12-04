"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchHotels = void 0;
const env_1 = require("../../config/env");
const mockHotels = [
    {
        id: "htl1",
        name: "Aurora Bay Hotel",
        neighborhood: "Harbor District",
        rating: 4.6,
        pricePerNight: 210,
        totalPrice: 1260,
        imageUrl: "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc?auto=format&fit=crop&w=800&q=60",
    },
    {
        id: "htl2",
        name: "Nomad Loft",
        neighborhood: "Creative Quarter",
        rating: 4.3,
        pricePerNight: 165,
        totalPrice: 990,
        imageUrl: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=60",
    },
];
const searchHotels = async (params) => {
    if (!env_1.env.HOTEL_API_KEY) {
        return mockHotels.map((hotel, index) => ({
            ...hotel,
            id: `${hotel.id}-${params.destination}-${index}`,
        }));
    }
    // Placeholder for real API request.
    return mockHotels;
};
exports.searchHotels = searchHotels;
//# sourceMappingURL=hotels.js.map