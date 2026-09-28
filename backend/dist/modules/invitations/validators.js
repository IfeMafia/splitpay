"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCodeInviteSchema = exports.createEmailInviteSchema = void 0;
const zod_1 = require("zod");
exports.createEmailInviteSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    expiresInDays: zod_1.z.number().int().min(1).max(30).default(7),
});
exports.createCodeInviteSchema = zod_1.z.object({
    expiresInDays: zod_1.z.number().int().min(1).max(30).default(7),
});
//# sourceMappingURL=validators.js.map