"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentLink = createPaymentLink;
exports.getPoolPaymentLinks = getPoolPaymentLinks;
exports.updatePaymentLink = updatePaymentLink;
exports.deletePaymentLink = deletePaymentLink;
exports.getPaymentLinkByToken = getPaymentLinkByToken;
exports.initializePayment = initializePayment;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../../lib/prisma");
const errorHandler_1 = require("../../middleware/errorHandler");
const client_1 = require("@prisma/client");
const token_1 = require("../../utils/token");
async function generateLinkToken() {
    let code = (0, token_1.generateCharToken)(3);
    let existing = await prisma_1.prisma.paymentLink.findUnique({ where: { token: code } });
    let attempts = 0;
    while (existing && attempts < 15) {
        code = (0, token_1.generateCharToken)(3);
        existing = await prisma_1.prisma.paymentLink.findUnique({ where: { token: code } });
        attempts++;
    }
    return existing ? `${code}-${crypto_1.default.randomBytes(2).toString('hex')}` : code;
}
async function createPaymentLink(poolId, userId, dto) {
    const token = await generateLinkToken();
    const link = await prisma_1.prisma.paymentLink.create({
        data: {
            poolId,
            token,
            title: dto.title,
            description: dto.description,
            amount: dto.amount,
            currency: dto.currency.toUpperCase(),
            isActive: true,
        },
    });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: 'PAYMENT_LINK',
            entityId: link.id,
            action: 'PAYMENT_LINK_CREATED',
            actorId: userId,
            metadata: { poolId, title: link.title, amount: Number(link.amount) },
        },
    });
    return {
        id: link.id,
        poolId: link.poolId,
        token: link.token,
        title: link.title,
        description: link.description,
        amount: Number(link.amount),
        currency: link.currency,
        isActive: link.isActive,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
    };
}
async function getPoolPaymentLinks(poolId) {
    const links = await prisma_1.prisma.paymentLink.findMany({
        where: { poolId },
        orderBy: { createdAt: 'desc' },
    });
    return links.map((l) => ({
        id: l.id,
        poolId: l.poolId,
        token: l.token,
        title: l.title,
        description: l.description,
        amount: Number(l.amount),
        currency: l.currency,
        isActive: l.isActive,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
    }));
}
async function updatePaymentLink(poolId, linkId, userId, dto) {
    const existing = await prisma_1.prisma.paymentLink.findUnique({
        where: { id: linkId },
    });
    if (!existing || existing.poolId !== poolId) {
        throw new errorHandler_1.AppError(404, 'Payment link not found', 'NOT_FOUND');
    }
    const updated = await prisma_1.prisma.paymentLink.update({
        where: { id: linkId },
        data: {
            title: dto.title,
            description: dto.description,
            amount: dto.amount,
            isActive: dto.isActive,
        },
    });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: 'PAYMENT_LINK',
            entityId: linkId,
            action: 'PAYMENT_LINK_UPDATED',
            actorId: userId,
            metadata: dto,
        },
    });
    return {
        id: updated.id,
        poolId: updated.poolId,
        token: updated.token,
        title: updated.title,
        description: updated.description,
        amount: Number(updated.amount),
        currency: updated.currency,
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
    };
}
async function deletePaymentLink(poolId, linkId, userId) {
    const existing = await prisma_1.prisma.paymentLink.findFirst({
        where: {
            OR: [
                { id: linkId },
                { token: linkId },
            ],
            poolId,
        },
    });
    if (!existing) {
        throw new errorHandler_1.AppError(404, 'Payment link not found', 'NOT_FOUND');
    }
    await prisma_1.prisma.paymentLink.update({
        where: { id: existing.id },
        data: { isActive: false },
    });
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: 'PAYMENT_LINK',
            entityId: linkId,
            action: 'PAYMENT_LINK_DEACTIVATED',
            actorId: userId,
        },
    });
}
async function getPaymentLinkByToken(token) {
    const link = await prisma_1.prisma.paymentLink.findUnique({
        where: { token },
        include: {
            pool: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    currency: true,
                },
            },
        },
    });
    if (!link) {
        throw new errorHandler_1.AppError(404, 'Payment link not found', 'NOT_FOUND');
    }
    if (!link.isActive) {
        throw new errorHandler_1.AppError(410, 'This payment link has been deactivated', 'PAYMENT_LINK_INACTIVE');
    }
    return {
        id: link.id,
        token: link.token,
        title: link.title,
        description: link.description,
        amount: Number(link.amount),
        currency: link.currency,
        pool: link.pool,
    };
}
async function initializePayment(token, dto) {
    const link = await prisma_1.prisma.paymentLink.findUnique({
        where: { token },
        include: { pool: true },
    });
    if (!link || !link.isActive) {
        throw new errorHandler_1.AppError(400, 'Payment link is not valid or has been deactivated', 'PAYMENT_LINK_INACTIVE');
    }
    const reference = `SPLIT-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex').toUpperCase()}`;
    // Create internal pending transaction
    const transaction = await prisma_1.prisma.$transaction(async (tx) => {
        const newTx = await tx.transaction.create({
            data: {
                poolId: link.poolId,
                paymentLinkId: link.id,
                amount: link.amount,
                currency: link.currency,
                provider: 'paystack',
                providerReference: reference,
                status: client_1.PaymentStatus.PENDING,
                payerEmail: dto.payerEmail.toLowerCase(),
                payerName: dto.payerName,
            },
        });
        await tx.transactionEvent.create({
            data: {
                transactionId: newTx.id,
                eventType: 'PAYMENT_INITIALIZED',
                data: {
                    payerEmail: dto.payerEmail,
                    payerName: dto.payerName,
                    reference,
                },
            },
        });
        return newTx;
    });
    return {
        transactionId: transaction.id,
        reference,
        amount: Number(link.amount),
        // Amount in minor units (e.g. kobo/cents) for Paystack
        amountMinor: Math.round(Number(link.amount) * 100),
        currency: link.currency,
        payerEmail: dto.payerEmail,
        payerName: dto.payerName,
        poolName: link.pool.name,
    };
}
//# sourceMappingURL=service.js.map