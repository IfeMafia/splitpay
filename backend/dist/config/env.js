"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required').optional().default('postgresql://user:password@localhost:5432/splitpay'),
    JWT_SECRET: zod_1.z.string().min(16, 'JWT_SECRET must be at least 16 characters').optional().default('development-jwt-secret-key-32chars'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().optional().default('no-reply@splitpay.local'),
    PAYSTACK_SECRET_KEY: zod_1.z.string().optional().default('sk_test_placeholder'),
    PAYSTACK_PUBLIC_KEY: zod_1.z.string().optional().default('pk_test_placeholder'),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
});
const _parsed = envSchema.safeParse(process.env);
if (!_parsed.success) {
    console.error('Invalid environment variables:');
    console.error(_parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = _parsed.data;
//# sourceMappingURL=env.js.map