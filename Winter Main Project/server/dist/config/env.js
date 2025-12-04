"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.string().default("development"),
    PORT: zod_1.z.string().default("4000"),
    DATABASE_URL: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string().min(16, "JWT_SECRET must be at least 16 characters"),
    FLIGHT_API_KEY: zod_1.z.string().optional(),
    HOTEL_API_KEY: zod_1.z.string().optional(),
    EVENTS_API_KEY: zod_1.z.string().optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid environment configuration:", parsed.error.format());
    throw new Error("Invalid environment configuration");
}
exports.env = {
    ...parsed.data,
    port: Number(parsed.data.PORT) || 4000,
    isProduction: parsed.data.NODE_ENV === "production",
};
//# sourceMappingURL=env.js.map