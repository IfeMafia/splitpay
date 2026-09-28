"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePaystackTransaction = initializePaystackTransaction;
exports.verifyPaystackTransaction = verifyPaystackTransaction;
exports.verifyPaystackWebhookSignature = verifyPaystackWebhookSignature;
exports.createPaystackTransferRecipient = createPaystackTransferRecipient;
exports.initiatePaystackTransfer = initiatePaystackTransfer;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
/**
 * Initialize a Paystack transaction via Paystack REST API.
 */
async function initializePaystackTransaction(params) {
    const secretKey = env_1.env.PAYSTACK_SECRET_KEY;
    // In test/dev mode without real Paystack key, return a mock response
    if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
        return {
            authorizationUrl: `https://checkout.paystack.com/mock-pay-${params.reference}`,
            accessCode: `mock_access_code_${params.reference}`,
            reference: params.reference,
        };
    }
    // Paystack expects amount in minor units (kobo -> 1 Naira = 100 kobo)
    const amountInKobo = Math.round(params.amountInNaira * 100);
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: params.email,
            amount: amountInKobo,
            reference: params.reference,
            callback_url: params.callbackUrl,
            metadata: params.metadata,
        }),
    });
    const body = (await response.json());
    if (!response.ok || !body.status) {
        throw new Error(`Paystack initialization failed: ${body.message || 'Unknown error'}`);
    }
    return {
        authorizationUrl: body.data.authorization_url,
        accessCode: body.data.access_code,
        reference: body.data.reference,
    };
}
/**
 * Verify a Paystack transaction by reference via Paystack REST API.
 */
async function verifyPaystackTransaction(reference) {
    const secretKey = env_1.env.PAYSTACK_SECRET_KEY;
    // In test/dev mode without real Paystack key, mock successful verification
    if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
        return {
            status: 'success',
            reference,
            amountInNaira: 1000,
            gatewayResponse: 'Successful (Mock)',
            paidAt: new Date().toISOString(),
            currency: 'NGN',
            feesInNaira: 15, // Mock 1.5% fee
            customerEmail: 'client@example.com',
        };
    }
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${secretKey}`,
        },
    });
    const body = (await response.json());
    if (!response.ok || !body.status) {
        throw new Error(`Paystack transaction verification failed: ${body.message || 'Unknown error'}`);
    }
    const data = body.data;
    return {
        status: data.status, // e.g. 'success'
        reference: data.reference,
        amountInNaira: (data.amount || 0) / 100, // convert kobo to Naira
        gatewayResponse: data.gateway_response,
        paidAt: data.paid_at,
        channel: data.channel,
        currency: data.currency || 'NGN',
        feesInNaira: (data.fees || 0) / 100,
        customerEmail: data.customer?.email || '',
        metadata: data.metadata,
    };
}
/**
 * Verifies Paystack webhook signature header (x-paystack-signature).
 */
async function verifyPaystackWebhookSignature(rawPayload, signatureHeader) {
    const secretKey = env_1.env.PAYSTACK_SECRET_KEY;
    if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
        // Skip strict check in test environment if key is placeholder
        return true;
    }
    if (!signatureHeader) {
        return false;
    }
    const payloadString = typeof rawPayload === 'string' ? rawPayload : rawPayload.toString('utf8');
    const hash = crypto_1.default
        .createHmac('sha512', secretKey)
        .update(payloadString)
        .digest('hex');
    return hash === signatureHeader;
}
/**
 * Creates a Paystack Transfer Recipient.
 */
async function createPaystackTransferRecipient(params) {
    const secretKey = env_1.env.PAYSTACK_SECRET_KEY;
    if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
        return `RCP_mock_${Date.now()}`;
    }
    const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            type: 'nuban',
            name: params.name,
            account_number: params.accountNumber,
            bank_code: params.bankCode,
            currency: params.currency || 'NGN',
        }),
    });
    const body = (await response.json());
    if (!response.ok || !body.status) {
        throw new Error(`Paystack transfer recipient creation failed: ${body.message || 'Unknown error'}`);
    }
    return body.data.recipient_code;
}
/**
 * Initiates a transfer / payout to a recipient via Paystack REST API.
 */
async function initiatePaystackTransfer(params) {
    const secretKey = env_1.env.PAYSTACK_SECRET_KEY;
    if (!secretKey || secretKey.startsWith('sk_test_placeholder')) {
        return {
            status: 'success',
            transferCode: `TRF_mock_${params.reference}`,
            reference: params.reference,
            amountInNaira: params.amountInNaira,
        };
    }
    const amountInKobo = Math.round(params.amountInNaira * 100);
    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            source: 'balance',
            amount: amountInKobo,
            recipient: params.recipientCode,
            reason: params.reason || 'SplitPay collaborator payout',
            reference: params.reference,
        }),
    });
    const body = (await response.json());
    if (!response.ok || !body.status) {
        throw new Error(`Paystack transfer initiation failed: ${body.message || 'Unknown error'}`);
    }
    return {
        status: body.data.status,
        transferCode: body.data.transfer_code,
        reference: body.data.reference,
        amountInNaira: (body.data.amount || 0) / 100,
    };
}
//# sourceMappingURL=paystack.js.map