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
exports.getPaymentLinks = getPaymentLinks;
exports.updatePaymentLink = updatePaymentLink;
exports.deletePaymentLink = deletePaymentLink;
exports.getCheckoutData = getCheckoutData;
exports.initializePayment = initializePayment;
const paymentLinkService = __importStar(require("./service"));
async function createPaymentLink(req, res, next) {
    try {
        const link = await paymentLinkService.createPaymentLink(req.params.poolId, req.user.id, req.body);
        res.status(201).json({
            data: link,
            message: 'Payment link created successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function getPaymentLinks(req, res, next) {
    try {
        const links = await paymentLinkService.getPoolPaymentLinks(req.params.poolId);
        res.status(200).json({ data: links });
    }
    catch (err) {
        next(err);
    }
}
async function updatePaymentLink(req, res, next) {
    try {
        const link = await paymentLinkService.updatePaymentLink(req.params.poolId, req.params.linkId, req.user.id, req.body);
        res.status(200).json({
            data: link,
            message: 'Payment link updated successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function deletePaymentLink(req, res, next) {
    try {
        await paymentLinkService.deletePaymentLink(req.params.poolId, req.params.linkId, req.user.id);
        res.status(200).json({
            message: 'Payment link deactivated successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
async function getCheckoutData(req, res, next) {
    try {
        const data = await paymentLinkService.getPaymentLinkByToken(req.params.token);
        res.status(200).json({ data });
    }
    catch (err) {
        next(err);
    }
}
async function initializePayment(req, res, next) {
    try {
        const data = await paymentLinkService.initializePayment(req.params.token, req.body);
        res.status(200).json({
            data,
            message: 'Payment initialized successfully',
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=controller.js.map