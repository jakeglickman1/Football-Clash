"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Missing authorization header" });
    }
    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing authorization header" });
    }
    try {
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Invalid authorization header" });
        }
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = { id: payload.id, email: payload.email };
        return next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map