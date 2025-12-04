"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const trip_routes_1 = __importDefault(require("../modules/trips/trip.routes"));
const wishlist_routes_1 = __importDefault(require("../modules/wishlist/wishlist.routes"));
const place_routes_1 = __importDefault(require("../modules/places/place.routes"));
const advisor_routes_1 = __importDefault(require("../modules/advisor/advisor.routes"));
const planner_routes_1 = __importDefault(require("../modules/planner/planner.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/trips", trip_routes_1.default);
router.use("/wishlist", wishlist_routes_1.default);
router.use("/places", place_routes_1.default);
router.use("/advisor", advisor_routes_1.default);
router.use("/trip-planner", planner_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map