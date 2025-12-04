"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyJsonArray = exports.parseJsonArray = void 0;
const parseJsonArray = (value) => {
    if (!value)
        return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
};
exports.parseJsonArray = parseJsonArray;
const stringifyJsonArray = (value) => JSON.stringify(value !== null && value !== void 0 ? value : []);
exports.stringifyJsonArray = stringifyJsonArray;
//# sourceMappingURL=serialization.js.map