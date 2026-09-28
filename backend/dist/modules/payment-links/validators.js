"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePaymentSchema = exports.updatePaymentLinkSchema = exports.createPaymentLinkSchema = void 0;
const zod_1 = require("zod");
exports.createPaymentLinkSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive('Amount must be greater than zero'),
    currency: zod_1.z.string().length(3).default('NGN'),
});
exports.updatePaymentLinkSchema = zod_1.z.object({
    title: zod_1.z.string().min(2).optional(),
    description: zod_1.z.string().optional().nullable(),
    amount: zod_1.z.number().positive().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.initializePaymentSchema = zod_1.z.object({
    payerEmail: zod_1.z.string().email('Valid email is required'),
    payerName: zod_1.z.string().min(2, 'Payer name is required'),
});
//# sourceMappingURL=validators.js.map