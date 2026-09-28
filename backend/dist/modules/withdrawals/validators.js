"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestWithdrawalSchema = void 0;
const zod_1 = require("zod");
exports.requestWithdrawalSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Withdrawal amount must be greater than zero'),
    bankCode: zod_1.z.string().min(2, 'Bank code is required'),
    accountNumber: zod_1.z.string().min(10, 'Valid 10-digit account number required').max(10),
    accountName: zod_1.z.string().min(2, 'Account name is required'),
});
//# sourceMappingURL=validators.js.map