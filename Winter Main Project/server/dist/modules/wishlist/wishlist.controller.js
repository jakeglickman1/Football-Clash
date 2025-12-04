"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteItem = exports.updateItem = exports.createItem = exports.listItems = void 0;
const zod_1 = require("zod");
const wishlistService = __importStar(require("./wishlist.service"));
const errorHandler_1 = require("../../middleware/errorHandler");
const wishlistSchema = zod_1.z.object({
    destination: zod_1.z.string().min(2),
    country: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().optional(),
    visited: zod_1.z.boolean().optional(),
});
const updateSchema = wishlistSchema.partial();
const listItems = async (req, res) => {
    const items = await wishlistService.listItems(req.user.id);
    res.json({ items });
};
exports.listItems = listItems;
const createItem = async (req, res) => {
    const payload = wishlistSchema.parse(req.body);
    const item = await wishlistService.createItem(req.user.id, payload);
    res.status(201).json({ item });
};
exports.createItem = createItem;
const updateItem = async (req, res) => {
    const id = req.params.id;
    if (!id) {
        throw new errorHandler_1.AppError("Wishlist id is required", 400);
    }
    const payload = updateSchema.parse(req.body);
    const item = await wishlistService.updateItem(req.user.id, id, payload);
    res.json({ item });
};
exports.updateItem = updateItem;
const deleteItem = async (req, res) => {
    const id = req.params.id;
    if (!id) {
        throw new errorHandler_1.AppError("Wishlist id is required", 400);
    }
    await wishlistService.deleteItem(req.user.id, id);
    res.status(204).send();
};
exports.deleteItem = deleteItem;
//# sourceMappingURL=wishlist.controller.js.map