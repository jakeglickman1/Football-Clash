"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const env_1 = require("../config/env");
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err, _req, res, _next) => {
    const status = err instanceof AppError ? err.statusCode : 500;
    const payload = {
        message: err.message || "Something went wrong",
        ...(env_1.env.isProduction ? {} : { stack: err.stack }),
    };
    if (!env_1.env.isProduction) {
        console.error(err);
    }
    res.status(status).json(payload);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map