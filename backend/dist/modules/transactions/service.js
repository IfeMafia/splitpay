"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoolTransactions = getPoolTransactions;
const prisma_1 = require("../../lib/prisma");
async function getPoolTransactions(poolId) {
    const transactions = await prisma_1.prisma.transaction.findMany({
        where: { poolId },
        orderBy: { createdAt: 'desc' },
    });
    return transactions.map((t) => ({
        id: t.id,
        poolId: t.poolId,
        paymentLinkId: t.paymentLinkId,
        amount: Number(t.amount),
        currency: t.currency,
        provider: t.provider,
        providerReference: t.providerReference,
        status: t.status,
        payerEmail: t.payerEmail,
        payerName: t.payerName,
        paidAt: t.paidAt,
        createdAt: t.createdAt,
    }));
}
//# sourceMappingURL=service.js.map