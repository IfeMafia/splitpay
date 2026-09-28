"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMemberSchema = exports.updatePoolSchema = exports.createPoolSchema = void 0;
const zod_1 = require("zod");
exports.createPoolSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Pool name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    currency: zod_1.z.string().length(3).default('NGN'),
});
exports.updatePoolSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional().nullable(),
    currency: zod_1.z.string().length(3).optional(),
});
exports.addMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    role: zod_1.z.enum(['OWNER', 'MEMBER']).default('MEMBER'),
});
//# sourceMappingURL=validators.js.map