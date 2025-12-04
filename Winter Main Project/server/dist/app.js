"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
app.use((0, morgan_1.default)("dev"));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", routes_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map