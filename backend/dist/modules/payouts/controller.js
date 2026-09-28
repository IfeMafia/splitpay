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
exports.triggerPayouts = triggerPayouts;
exports.getPaymentPayouts = getPaymentPayouts;
exports.requestWithdrawal = requestWithdrawal;
exports.retryPayout = retryPayout;
const payoutService = __importStar(require("./service"));
async function triggerPayouts(req, res, next) {
    try {
        const payouts = await payoutService.triggerPayoutsForPayment(req.body.paymentId);
        res.status(200).json({ data: payouts });
    }
    catch (err) {
        next(err);
    }
}
async function getPaymentPayouts(req, res, next) {
    try {
        const payouts = await payoutService.getPayoutsForPayment(req.params.paymentId);
        res.status(200).json({ data: payouts });
    }
    catch (err) {
        next(err);
    }
}
async function requestWithdrawal(req, res, next) {
    try {
        const withdrawal = await payoutService.requestWithdrawal(req.body);
        res.status(201).json({ data: withdrawal });
    }
    catch (err) {
        next(err);
    }
}
async function retryPayout(req, res, next) {
    try {
        const payout = await payoutService.retryPayoutTransaction(req.params.id);
        res.status(200).json({ data: payout });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map