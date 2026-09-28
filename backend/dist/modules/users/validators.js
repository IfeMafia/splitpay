"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: zod_1.z.string().optional().nullable(),
    defaultCurrency: zod_1.z.string().length(3).optional(),
    country: zod_1.z.string().length(2).optional(),
});
//# sourceMappingURL=validators.js.map