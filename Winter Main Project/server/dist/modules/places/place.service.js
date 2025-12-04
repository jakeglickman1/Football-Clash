"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVisitedPlaces = void 0;
const prisma_1 = require("../../config/prisma");
const serialization_1 = require("../../utils/serialization");
const listVisitedPlaces = async (userId, tripId) => {
    const places = await prisma_1.prisma.visitedPlace.findMany({
        where: { userId, ...(tripId ? { tripId } : {}) },
    });
    return places.map((place) => ({
        ...place,
        photos: (0, serialization_1.parseJsonArray)(place.photos),
    }));
};
exports.listVisitedPlaces = listVisitedPlaces;
//# sourceMappingURL=place.service.js.map