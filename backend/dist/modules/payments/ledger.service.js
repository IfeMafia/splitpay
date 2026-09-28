"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFinancialChain = calculateFinancialChain;
exports.confirmPaymentTransaction = confirmPaymentTransaction;
const prisma_1 = require("../../lib/prisma");
const errorHandler_1 = require("../../middleware/errorHandler");
const paystack_1 = require("../../lib/paystack");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
/**
 * Calculates the exact financial chain values using integer minor-unit arithmetic (kobo).
 * This is a pure function — no side effects.
 */
function calculateFinancialChain(grossAmountNaira, platformFeePercent = 0, providerFeeNaira = 0, collaborators) {
    const grossKobo = Math.round(grossAmountNaira * 100);
    const providerFeeKobo = Math.round(providerFeeNaira * 100);
    const platformFeeKobo = Math.round(grossKobo * (platformFeePercent / 100));
    const taxKobo = 0;
    const distributableKobo = Math.max(0, grossKobo - providerFeeKobo - platformFeeKobo - taxKobo);
    let allocatedKoboSum = 0;
    const allocations = collaborators.map((c, idx) => {
        const splitPct = typeof c.splitPercentage === 'number' ? c.splitPercentage : Number(c.splitPercentage);
        let allocKobo = Math.floor(distributableKobo * (splitPct / 100));
        // Last collaborator gets any remaining kobo to guarantee 100% total
        if (idx === collaborators.length - 1) {
            allocKobo = distributableKobo - allocatedKoboSum;
        }
        allocatedKoboSum += allocKobo;
        return {
            collaboratorId: c.id,
            userId: c.userId,
            role: c.role,
            splitPercentage: splitPct,
            amount: allocKobo / 100,
        };
    });
    return {
        grossAmount: grossKobo / 100,
        providerFee: providerFeeKobo / 100,
        platformFee: platformFeeKobo / 100,
        tax: taxKobo / 100,
        distributableAmount: distributableKobo / 100,
        collaboratorAllocations: allocations,
    };
}
/**
 * Authoritative Payment Confirmation & State Machine.
 * 1. Verify with Paystack
 * 2. Update Transaction to SUCCESSFUL/FAILED
 * 3. Build SplitSnapshot from current PoolMembers
 * 4. Persist SplitAllocations
 * Returns the payment data and financial breakdown as per Tobi's docs.
 */
async function confirmPaymentTransaction(reference) {
    // 1. Find the Transaction by providerReference
    const transaction = await prisma_1.prisma.transaction.findUnique({
        where: { providerReference: reference },
        include: {
            paymentLink: true,
            pool: { select: { id: true, name: true, ownerId: true, members: { include: { user: true } } } },
            splitSnapshot: { include: { allocations: true } },
        },
    });
    if (!transaction) {
        throw new errorHandler_1.AppError(404, 'Transaction not found for this reference', 'NOT_FOUND');
    }
    // 2. Idempotency — if already confirmed, return persisted breakdown
    if (transaction.status === client_1.PaymentStatus.SUCCESSFUL && transaction.splitSnapshot) {
        const snapshot = transaction.splitSnapshot;
        const breakdown = {
            grossAmount: Number(snapshot.totalAmount),
            providerFee: 0,
            platformFee: 0,
            tax: 0,
            distributableAmount: Number(snapshot.distributableAmount),
            collaboratorAllocations: snapshot.allocations.map(a => ({
                collaboratorId: a.poolMemberId,
                userId: null,
                role: 'Collaborator',
                splitPercentage: Number(a.percentage),
                amount: Number(a.amount),
            })),
        };
        return {
            payment: {
                id: transaction.id,
                status: 'SUCCESSFUL',
                actualAmount: Number(transaction.amount).toFixed(2),
                paidAt: transaction.paidAt,
            },
            breakdown,
        };
    }
    // 3. Verify with Paystack
    const paystackData = await (0, paystack_1.verifyPaystackTransaction)(reference);
    const isSuccess = paystackData.status === 'success';
    if (!isSuccess) {
        // Mark transaction as failed
        await prisma_1.prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: client_1.PaymentStatus.FAILED },
        });
        return {
            payment: {
                id: transaction.id,
                status: 'FAILED',
                actualAmount: Number(transaction.amount).toFixed(2),
                paidAt: null,
            },
            breakdown: calculateFinancialChain(Number(transaction.amount), 0, 0, []),
        };
    }
    // 4. Build pool members for allocation
    const members = transaction.pool.members;
    const splitConfig = await prisma_1.prisma.splitConfiguration.findFirst({
        where: { poolId: transaction.poolId },
        orderBy: { updatedAt: 'desc' },
    });
    const configuredType = splitConfig?.type ?? client_2.SplitType.EQUAL;
    const equalSplit = members.length > 0 ? 100 / members.length : 0;
    let snapshotType = client_2.SplitType.EQUAL;
    let collaboratorsForCalc = members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        splitPercentage: equalSplit,
    }));
    if (configuredType === client_2.SplitType.CUSTOM && splitConfig && Array.isArray(splitConfig.configuration) && members.length > 0) {
        const shareMap = new Map();
        for (const item of splitConfig.configuration) {
            if (!item || !item.memberId || item.percentage === undefined)
                continue;
            shareMap.set(String(item.memberId), Number(item.percentage));
        }
        const customCollaborators = members.map((m) => ({
            id: m.id,
            userId: m.userId,
            role: m.role,
            splitPercentage: shareMap.get(m.id) ?? shareMap.get(m.userId) ?? NaN,
        }));
        const hasAllPercentages = customCollaborators.every((m) => Number.isFinite(m.splitPercentage));
        const totalPercentage = customCollaborators.reduce((sum, m) => sum + Number(m.splitPercentage), 0);
        if (hasAllPercentages && Math.abs(totalPercentage - 100) <= 0.01) {
            snapshotType = client_2.SplitType.CUSTOM;
            collaboratorsForCalc = customCollaborators;
        }
    }
    const breakdown = calculateFinancialChain(paystackData.amountInNaira, 0, // platform fee %
    paystackData.feesInNaira, collaboratorsForCalc);
    // 5. Persist everything in a transaction
    await prisma_1.prisma.$transaction(async (tx) => {
        // Update transaction record
        await tx.transaction.update({
            where: { id: transaction.id },
            data: {
                status: client_1.PaymentStatus.SUCCESSFUL,
                amount: paystackData.amountInNaira,
                payerEmail: paystackData.customerEmail,
                paidAt: paystackData.paidAt ? new Date(paystackData.paidAt) : new Date(),
            },
        });
        // Create SplitSnapshot (immutable freeze)
        const snapshot = await tx.splitSnapshot.create({
            data: {
                poolId: transaction.poolId,
                transactionId: transaction.id,
                type: snapshotType,
                snapshotData: collaboratorsForCalc,
                totalAmount: breakdown.grossAmount,
                distributableAmount: breakdown.distributableAmount,
            },
        });
        // Create SplitAllocations
        if (members.length > 0) {
            await tx.splitAllocation.createMany({
                data: breakdown.collaboratorAllocations.map(a => ({
                    snapshotId: snapshot.id,
                    poolMemberId: a.collaboratorId,
                    percentage: a.splitPercentage,
                    amount: a.amount,
                    currency: transaction.currency,
                })),
            });
        }
        // Mark payment link as inactive (can't be paid again)
        if (transaction.paymentLinkId) {
            await tx.paymentLink.update({
                where: { id: transaction.paymentLinkId },
                data: { isActive: false },
            });
        }
        // Notify pool owner that payment has been received
        try {
            const poolName = transaction.pool.name;
            await tx.notification.create({
                data: {
                    userId: transaction.pool.ownerId,
                    title: 'Payment received',
                    message: `A payment of ₦${breakdown.grossAmount.toLocaleString()} has been confirmed for "${poolName}".`,
                    type: 'PAYMENT_RECEIVED',
                    data: {
                        poolId: transaction.poolId,
                        transactionId: transaction.id,
                        grossAmount: breakdown.grossAmount,
                        reference,
                    },
                },
            });
            // Notify collaborators with their respective allocation shares
            for (const alloc of breakdown.collaboratorAllocations) {
                if (alloc.userId && alloc.userId !== transaction.pool.ownerId) {
                    await tx.notification.create({
                        data: {
                            userId: alloc.userId,
                            title: 'Payment Allocated',
                            message: `You received ₦${alloc.amount.toLocaleString()} (${alloc.splitPercentage}%) from a confirmed payment in "${poolName}".`,
                            type: 'PAYMENT_ALLOCATED',
                            data: {
                                poolId: transaction.poolId,
                                transactionId: transaction.id,
                                amount: alloc.amount,
                                percentage: alloc.splitPercentage,
                                reference,
                            },
                        },
                    });
                }
            }
        }
        catch {
            // Notification failure must not abort the payment confirmation
        }
        // Audit log
        await tx.auditLog.create({
            data: {
                entityType: 'TRANSACTION',
                entityId: transaction.id,
                action: 'PAYMENT_CONFIRMED',
                metadata: { reference, grossAmount: breakdown.grossAmount },
            },
        });
    });
    return {
        payment: {
            id: transaction.id,
            status: 'SUCCESSFUL',
            actualAmount: paystackData.amountInNaira.toFixed(2),
            paidAt: paystackData.paidAt ?? new Date().toISOString(),
        },
        breakdown,
    };
}
//# sourceMappingURL=ledger.service.js.map