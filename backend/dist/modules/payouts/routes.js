"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payoutController = __importStar(require("./controller"));
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const triggerPayoutSchema = zod_1.z.object({
    paymentId: zod_1.z.string().uuid(),
});
const withdrawSchema = zod_1.z.object({
    collaboratorId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
    accountName: zod_1.z.string().optional(),
    accountNumber: zod_1.z.string().optional(),
    bankCode: zod_1.z.string().optional(),
});
router.use(auth_1.authenticate);
router.post('/withdraw', (0, validate_1.validateBody)(withdrawSchema), payoutController.requestWithdrawal);
router.post('/trigger', (0, validate_1.validateBody)(triggerPayoutSchema), payoutController.triggerPayouts);
router.get('/payment/:paymentId', payoutController.getPaymentPayouts);
router.post('/:id/retry', payoutController.retryPayout);
exports.default = router;
//# sourceMappingURL=routes.js.map