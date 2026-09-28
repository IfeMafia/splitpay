"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFinancialChain = void 0;
exports.createPaymentLink = createPaymentLink;
exports.getPaymentByToken = getPaymentByToken;
exports.initializePaymentTransactionByToken = initializePaymentTransactionByToken;
exports.getProjectPayments = getProjectPayments;
const prisma_1 = require("../../lib/prisma");
const errorHandler_1 = require("../../middleware/errorHandler");
const paystack_1 = require("../../lib/paystack");
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const token_1 = require("../../utils/token");
/**
 * Maps a PaymentLink (+ optional latest Transaction) to the unified response shape
 * the frontend and Tobi's docs expect.
 */
function mapPaymentLink(link) {
    // Pick the most relevant transaction (SUCCESSFUL first, then latest)
    const txns = link.transactions ?? [];
    const successTxn = txns.find(t => t.status === client_1.PaymentStatus.SUCCESSFUL);
    const latestTxn = txns[0];
    const activeTxn = successTxn ?? latestTxn ?? null;
    const isPaid = activeTxn?.status === client_1.PaymentStatus.SUCCESSFUL;
    return {
        id: link.id,
        poolId: link.poolId,
        projectId: link.poolId, // alias for frontend
        token: link.token,
        paymentLinkToken: link.token, // alias for frontend
        title: link.title,
        amount: Number(link.amount),
        expectedAmount: Number(link.amount),
        currency: link.currency,
        provider: 'paystack',
        isActive: link.isActive,
        status: isPaid ? 'SUCCESSFUL' : 'PENDING',
        transactionStatus: activeTxn?.status ?? null,
        providerReference: activeTxn?.providerReference ?? null,
        actualAmount: activeTxn && isPaid ? Number(activeTxn.amount) : null,
        paidAt: activeTxn?.paidAt ?? null,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
    };
}
/**
 * Create a shareable PaymentLink for a pool.
 * Body: { projectId, expectedAmount, currency, provider }  (frontend shape)
 */
async function createPaymentLink(actorId, dto) {
    const pool = await prisma_1.prisma.pool.findUnique({ where: { id: dto.projectId } });
    if (!pool)
        throw new errorHandler_1.AppError(404, 'Pool not found', 'NOT_FOUND');
    if (pool.ownerId !== actorId) {
        throw new errorHandler_1.AppError(403, 'Only the pool owner can create payment links', 'FORBIDDEN');
    }
    let tokenCode = (0, token_1.generateCharToken)(3);
    let existingToken = await prisma_1.prisma.paymentLink.findUnique({ where: { token: tokenCode } });
    let attempts = 0;
    while (existingToken && attempts < 15) {
        tokenCode = (0, token_1.generateCharToken)(3);
        existingToken = await prisma_1.prisma.paymentLink.findUnique({ where: { token: tokenCode } });
        attempts++;
    }
    const token = existingToken ? `${tokenCode}-${crypto_1.default.randomBytes(2).toString('hex')}` : tokenCode;
    const link = await prisma_1.prisma.paymentLink.create({
        data: {
            poolId: dto.projectId,
            token,
            title: `Payment for ${pool.name}`,
            amount: dto.expectedAmount,
            currency: dto.currency.toUpperCase(),
        },
    });
    const payment = mapPaymentLink({ ...link, transactions: [] });
    const checkoutUrl = `/pay/${token}`;
    return { payment, checkoutUrl };
}
/**
 * Fetch public payment link details by token.
 * Used by the public checkout page.
 */
async function getPaymentByToken(token) {
    const link = await prisma_1.prisma.paymentLink.findUnique({
        where: { token },
        include: {
            transactions: {
                orderBy: { createdAt: 'desc' },
                take: 5,
            },
        },
    });
    if (!link)
        throw new errorHandler_1.AppError(404, 'Payment link not found', 'NOT_FOUND');
    if (!link.isActive)
        throw new errorHandler_1.AppError(410, 'This payment link is no longer active', 'LINK_INACTIVE');
    return mapPaymentLink(link);
}
/**
 * Initialize a Paystack checkout for a payment link.
 * Creates a pending Transaction and returns the Paystack authorization URL.
 */
async function initializePaymentTransactionByToken(token, dto) {
    const link = await prisma_1.prisma.paymentLink.findUnique({
        where: { token },
        include: {
            pool: true,
            transactions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
    });
    if (!link)
        throw new errorHandler_1.AppError(404, 'Payment link not found', 'NOT_FOUND');
    if (!link.isActive)
        throw new errorHandler_1.AppError(410, 'This payment link is no longer active', 'LINK_INACTIVE');
    // Prevent double-payment
    const existingSuccess = link.transactions.find(t => t.status === client_1.PaymentStatus.SUCCESSFUL);
    if (existingSuccess) {
        throw new errorHandler_1.AppError(400, 'This payment link has already been paid', 'ALREADY_PAID');
    }
    const reference = `sp_${link.id.slice(0, 8)}_${Date.now()}`;
    // Initialize with Paystack (real API or mock in dev)
    const paystackInit = await (0, paystack_1.initializePaystackTransaction)({
        email: dto.email || 'client@splitpay.com',
        amountInNaira: Number(link.amount),
        reference,
        callbackUrl: dto.callbackUrl,
        metadata: {
            paymentLinkId: link.id,
            poolId: link.poolId,
            token,
        },
    });
    // Create a pending Transaction record
    await prisma_1.prisma.transaction.create({
        data: {
            poolId: link.poolId,
            paymentLinkId: link.id,
            amount: link.amount,
            currency: link.currency,
            provider: 'paystack',
            providerReference: paystackInit.reference,
            status: client_1.PaymentStatus.PENDING,
            payerEmail: dto.email,
        },
    });
    const payment = mapPaymentLink(link);
    return {
        authorizationUrl: paystackInit.authorizationUrl,
        reference: paystackInit.reference,
        payment,
    };
}
/**
 * Get all payment links for a pool, including transaction status.
 */
async function getProjectPayments(poolId) {
    const links = await prisma_1.prisma.paymentLink.findMany({
        where: { poolId },
        include: {
            transactions: {
                orderBy: { createdAt: 'desc' },
                take: 5,
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return links.map(mapPaymentLink);
}
var ledger_service_1 = require("./ledger.service");
Object.defineProperty(exports, "calculateFinancialChain", { enumerable: true, get: function () { return ledger_service_1.calculateFinancialChain; } });
//# sourceMappingURL=service.js.map