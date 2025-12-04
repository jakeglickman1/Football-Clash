"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const prisma_1 = require("../../config/prisma");
const jwt_1 = require("../../utils/jwt");
const password_1 = require("../../utils/password");
const errorHandler_1 = require("../../middleware/errorHandler");
const signup = async ({ email, password, name }) => {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new errorHandler_1.AppError("Email is already registered", 400);
    }
    const passwordHash = await (0, password_1.hashPassword)(password);
    const user = await prisma_1.prisma.user.create({
        data: { email, passwordHash, name },
    });
    const token = (0, jwt_1.signToken)({ id: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
};
exports.signup = signup;
const login = async ({ email, password }) => {
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new errorHandler_1.AppError("Invalid credentials", 401);
    }
    const isValid = await (0, password_1.comparePassword)(password, user.passwordHash);
    if (!isValid) {
        throw new errorHandler_1.AppError("Invalid credentials", 401);
    }
    const token = (0, jwt_1.signToken)({ id: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
};
exports.login = login;
//# sourceMappingURL=auth.service.js.map