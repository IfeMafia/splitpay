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
exports.createPaymentLink = createPaymentLink;
exports.initializePaystackPayment = initializePaystackPayment;
exports.verifyPaymentTransaction = verifyPaymentTransaction;
exports.getPaymentByToken = getPaymentByToken;
exports.getProjectPayments = getProjectPayments;
exports.calculateFeePreview = calculateFeePreview;
const paymentService = __importStar(require("./service"));
const ledger_service_1 = require("./ledger.service");
async function createPaymentLink(req, res, next) {
    try {
        // Frontend sends { projectId, expectedAmount, currency, provider }
        // Map to service signature
        const { projectId, expectedAmount, currency, provider } = req.body;
        const result = await paymentService.createPaymentLink(req.user.id, {
            projectId,
            expectedAmount: Number(expectedAmount),
            currency,
            provider,
        });
        res.status(201).json({ data: result });
    }
    catch (err) {
        next(err);
    }
}
async function initializePaystackPayment(req, res, next) {
    try {
        const token = req.params.token;
        const result = await paymentService.initializePaymentTransactionByToken(token, req.body);
        res.status(200).json({ data: result });
    }
    catch (err) {
        next(err);
    }
}
async function verifyPaymentTransaction(req, res, next) {
    try {
        const reference = req.params.reference;
        const result = await (0, ledger_service_1.confirmPaymentTransaction)(reference);
        res.status(200).json({ data: result });
    }
    catch (err) {
        next(err);
    }
}
async function getPaymentByToken(req, res, next) {
    try {
        const payment = await paymentService.getPaymentByToken(req.params.token);
        res.status(200).json({ data: payment });
    }
    catch (err) {
        next(err);
    }
}
async function getProjectPayments(req, res, next) {
    try {
        const poolId = req.params.projectId;
        const payments = await paymentService.getProjectPayments(poolId);
        res.status(200).json({ data: payments });
    }
    catch (err) {
        next(err);
    }
}
async function calculateFeePreview(req, res, next) {
    try {
        const { amount, platformFeePercent, providerFee, collaborators } = req.body;
        const { calculateFinancialChain } = await Promise.resolve().then(() => __importStar(require('./ledger.service')));
        const breakdown = calculateFinancialChain(Number(amount), Number(platformFeePercent ?? 0), Number(providerFee ?? 0), collaborators ?? []);
        res.status(200).json({ data: breakdown });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map