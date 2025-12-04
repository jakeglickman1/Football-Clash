"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHighlight = exports.createTrip = exports.getTripById = exports.listTrips = void 0;
const prisma_1 = require("../../config/prisma");
const errorHandler_1 = require("../../middleware/errorHandler");
const serialization_1 = require("../../utils/serialization");
const mapHighlight = (highlight) => ({
    ...highlight,
    photos: (0, serialization_1.parseJsonArray)(highlight.photos),
});
const mapTrip = (trip) => {
    var _a, _b, _c, _d;
    return ({
        ...trip,
        highlights: (_b = (_a = trip.highlights) === null || _a === void 0 ? void 0 : _a.map(mapHighlight)) !== null && _b !== void 0 ? _b : [],
        visitedPlaces: (_d = (_c = trip.visitedPlaces) === null || _c === void 0 ? void 0 : _c.map((place) => ({
            ...place,
            photos: (0, serialization_1.parseJsonArray)(place.photos),
        }))) !== null && _d !== void 0 ? _d : [],
    });
};
const listTrips = async (userId) => {
    const trips = await prisma_1.prisma.trip.findMany({
        where: { userId },
        include: { highlights: true, visitedPlaces: true },
        orderBy: { startDate: "asc" },
    });
    return trips.map(mapTrip);
};
exports.listTrips = listTrips;
const getTripById = async (userId, tripId) => {
    const trip = await prisma_1.prisma.trip.findFirst({
        where: { id: tripId, userId },
        include: { highlights: true, visitedPlaces: true },
    });
    if (!trip) {
        throw new errorHandler_1.AppError("Trip not found", 404);
    }
    return mapTrip(trip);
};
exports.getTripById = getTripById;
const createTrip = async (userId, data) => {
    const trip = await prisma_1.prisma.trip.create({
        data: {
            userId,
            destination: data.destination,
            country: data.country,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            notes: data.notes,
        },
    });
    return trip;
};
exports.createTrip = createTrip;
const addHighlight = async (userId, tripId, data) => {
    var _a;
    const trip = await prisma_1.prisma.trip.findFirst({ where: { id: tripId, userId } });
    if (!trip) {
        throw new errorHandler_1.AppError("Trip not found", 404);
    }
    const highlight = await prisma_1.prisma.highlight.create({
        data: {
            tripId,
            title: data.title,
            caption: data.caption,
            occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
            photos: (0, serialization_1.stringifyJsonArray)((_a = data.photos) !== null && _a !== void 0 ? _a : []),
        },
    });
    return mapHighlight(highlight);
};
exports.addHighlight = addHighlight;
//# sourceMappingURL=trip.service.js.map