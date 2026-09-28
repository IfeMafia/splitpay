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
const paymentController = __importStar(require("./controller"));
const controller_1 = require("../webhooks/controller");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createPaymentSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    expectedAmount: zod_1.z.number().positive(),
    currency: zod_1.z.string().length(3),
    provider: zod_1.z.string().min(1),
});
// Public checkout, verification, webhook, and callback routes
router.post("/calculate", paymentController.calculateFeePreview);
router.get("/link/:token", paymentController.getPaymentByToken);
router.post("/pay/:token/initialize", paymentController.initializePaystackPayment);
router.post("/initialize/:token", paymentController.initializePaystackPayment);
router.get("/verify/:reference", paymentController.verifyPaymentTransaction);
router.post("/webhook", (req, res, next) => {
    req.params.provider = "paystack";
    (0, controller_1.handleProviderWebhook)(req, res, next);
});
router.get("/callback", (req, res) => {
    const reference = (req.query.trxref || req.query.reference);
    if (reference) {
        res.redirect(`/api/payments/verify/${reference}`);
    }
    else {
        res.status(400).json({ error: "Missing reference parameter in callback URL" });
    }
});
// Protected routes
router.use(auth_1.authenticate);
router.post("/link", (0, validate_1.validateBody)(createPaymentSchema), paymentController.createPaymentLink);
router.get("/project/:projectId", paymentController.getProjectPayments);
exports.default = router;
//# sourceMappingURL=routes.js.map