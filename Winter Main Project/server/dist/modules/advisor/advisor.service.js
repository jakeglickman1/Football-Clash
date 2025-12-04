"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAdvisorSearch = void 0;
const flights_1 = require("../../services/external/flights");
const hotels_1 = require("../../services/external/hotels");
const runAdvisorSearch = async (params) => {
    var _a;
    const [flights, hotels] = await Promise.all([
        (0, flights_1.searchFlights)({
            origin: "SFO",
            destination: params.destination,
            startDate: params.startDate,
            endDate: params.endDate,
        }),
        (0, hotels_1.searchHotels)({
            destination: params.destination,
            startDate: params.startDate,
            endDate: params.endDate,
            stayType: params.stayType,
        }),
    ]);
    const notes = [
        `Plan for ${(_a = params.travelers) !== null && _a !== void 0 ? _a : 1} traveler(s).`,
        params.stayType
            ? `Showing ${params.stayType} stays; adjust in settings for more results.`
            : "Update stay type to fine-tune hotel results.",
    ];
    return { flights, hotels, notes };
};
exports.runAdvisorSearch = runAdvisorSearch;
//# sourceMappingURL=advisor.service.js.map