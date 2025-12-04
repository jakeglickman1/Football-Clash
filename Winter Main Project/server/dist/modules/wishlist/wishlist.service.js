"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItem = exports.updateItem = exports.createItem = exports.listItems = void 0;
const prisma_1 = require("../../config/prisma");
const errorHandler_1 = require("../../middleware/errorHandler");
const serialization_1 = require("../../utils/serialization");
const mapWishlistItem = (item) => ({
    ...item,
    tags: (0, serialization_1.parseJsonArray)(item.tags),
});
const listItems = async (userId) => {
    const items = await prisma_1.prisma.wishlistItem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
    return items.map(mapWishlistItem);
};
exports.listItems = listItems;
const createItem = async (userId, data) => {
    var _a, _b;
    const item = await prisma_1.prisma.wishlistItem.create({
        data: {
            userId,
            destination: data.destination,
            country: data.country,
            visited: (_a = data.visited) !== null && _a !== void 0 ? _a : false,
            notes: data.notes,
            tags: (0, serialization_1.stringifyJsonArray)((_b = data.tags) !== null && _b !== void 0 ? _b : []),
        },
    });
    return mapWishlistItem(item);
};
exports.createItem = createItem;
const updateItem = async (userId, itemId, data) => {
    var _a, _b, _c, _d;
    const existing = await prisma_1.prisma.wishlistItem.findFirst({
        where: { id: itemId, userId },
    });
    if (!existing) {
        throw new errorHandler_1.AppError("Wishlist item not found", 404);
    }
    const updated = await prisma_1.prisma.wishlistItem.update({
        where: { id: itemId },
        data: {
            destination: (_a = data.destination) !== null && _a !== void 0 ? _a : existing.destination,
            country: (_b = data.country) !== null && _b !== void 0 ? _b : existing.country,
            visited: (_c = data.visited) !== null && _c !== void 0 ? _c : existing.visited,
            notes: (_d = data.notes) !== null && _d !== void 0 ? _d : existing.notes,
            tags: data.tags !== undefined
                ? (0, serialization_1.stringifyJsonArray)(data.tags)
                : existing.tags,
        },
    });
    return mapWishlistItem(updated);
};
exports.updateItem = updateItem;
const deleteItem = async (userId, itemId) => {
    const existing = await prisma_1.prisma.wishlistItem.findFirst({
        where: { id: itemId, userId },
    });
    if (!existing) {
        throw new errorHandler_1.AppError("Wishlist item not found", 404);
    }
    await prisma_1.prisma.wishlistItem.delete({ where: { id: itemId } });
    return { success: true };
};
exports.deleteItem = deleteItem;
//# sourceMappingURL=wishlist.service.js.map