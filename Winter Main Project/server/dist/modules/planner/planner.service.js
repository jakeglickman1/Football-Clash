"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendations = void 0;
const date_fns_1 = require("date-fns");
const events_1 = require("../../services/external/events");
const getRecommendations = async (params) => {
    const lengthOfStay = (0, date_fns_1.differenceInCalendarDays)(new Date(params.endDate), new Date(params.startDate)) +
        1;
    const [activities, events] = await Promise.all([
        (0, events_1.fetchActivities)({ destination: params.destination, interests: params.interests }),
        (0, events_1.fetchEvents)({ destination: params.destination, interests: params.interests }),
    ]);
    return {
        destination: params.destination,
        startDate: params.startDate,
        endDate: params.endDate,
        lengthOfStay,
        activities,
        events,
    };
};
exports.getRecommendations = getRecommendations;
//# sourceMappingURL=planner.service.js.map