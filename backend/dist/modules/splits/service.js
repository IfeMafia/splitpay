"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSplitConfig = getSplitConfig;
exports.configureSplit = configureSplit;
exports.createSnapshotAndAllocationsForTransaction = createSnapshotAndAllocationsForTransaction;
exports.getPoolAllocations = getPoolAllocations;
exports.getPoolBalance = getPoolBalance;
const prisma_1 = require("../../lib/prisma");
const errorHandler_1 = require("../../middleware/errorHandler");
const splitEngine_1 = require("./splitEngine");
const client_1 = require("@prisma/client");
async function getSplitConfig(poolId) {
    const existingConfig = await prisma_1.prisma.splitConfiguration.findFirst({
        where: { poolId },
        orderBy: { updatedAt: 'desc' },
    });
    const members = await prisma_1.prisma.poolMember.findMany({
        where: { poolId },
    });
    if (!existingConfig) {
        // Generate default EQUAL configuration
        const equalShare = members.length > 0 ? Math.round((100 / members.length) * 100) / 100 : 0;
        return {
            id: 'default',
            poolId,
            type: 'EQUAL',
            configuration: members.map((m) => ({
                memberId: m.id,
                percentage: equalShare,
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    return {
        id: existingConfig.id,
        poolId: existingConfig.poolId,
        type: existingConfig.type,
        configuration: existingConfig.configuration,
        createdAt: existingConfig.createdAt,
        updatedAt: existingConfig.updatedAt,
    };
}
async function configureSplit(poolId, userId, dto) {
    const pool = await prisma_1.prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool)
        throw new errorHandler_1.AppError(404, 'Pool not found', 'NOT_FOUND');
    if (pool.ownerId !== userId) {
        throw new errorHandler_1.AppError(403, 'Only the pool owner can configure or edit splits', 'FORBIDDEN');
    }
    const [members, invitations] = await Promise.all([
        prisma_1.prisma.poolMember.findMany({ where: { poolId } }),
        prisma_1.prisma.poolInvitation.findMany({
            where: { poolId, status: client_1.InvitationStatus.PENDING },
        }),
    ]);
    const memberIds = new Set([
        ...members.map((m) => m.id),
        ...members.map((m) => m.userId),
        ...invitations.map((i) => i.token),
        ...invitations.map((i) => i.id),
    ]);
    let finalConfig = [];
    if (dto.type === 'CUSTOM') {
        if (!dto.shares || dto.shares.length === 0) {
            throw new errorHandler_1.AppError(400, 'Custom shares configuration is required', 'BAD_REQUEST');
        }
        for (const share of dto.shares) {
            if (!memberIds.has(share.memberId)) {
                throw new errorHandler_1.AppError(400, `Member ${share.memberId} does not belong to this Pool`, 'INVALID_MEMBER');
            }
        }
        finalConfig = dto.shares;
    }
    else {
        // Equal distribution among all pool members and invited collaborators
        const allParticipantIds = [
            ...members.map((m) => m.id),
            ...invitations.map((i) => i.token),
        ];
        const count = allParticipantIds.length;
        const equalPct = count > 0 ? Math.round((100 / count) * 100) / 100 : 0;
        finalConfig = allParticipantIds.map((id) => ({
            memberId: id,
            percentage: equalPct,
        }));
    }
    const existing = await prisma_1.prisma.splitConfiguration.findFirst({
        where: { poolId },
    });
    let config;
    if (existing) {
        config = await prisma_1.prisma.splitConfiguration.update({
            where: { id: existing.id },
            data: {
                type: dto.type,
                configuration: finalConfig,
            },
        });
    }
    else {
        config = await prisma_1.prisma.splitConfiguration.create({
            data: {
                poolId,
                type: dto.type,
                configuration: finalConfig,
            },
        });
    }
    await prisma_1.prisma.auditLog.create({
        data: {
            entityType: 'SPLIT_CONFIGURATION',
            entityId: config.id,
            action: 'SPLIT_CONFIGURED',
            actorId: userId,
            metadata: { type: config.type, configuration: finalConfig },
        },
    });
    return {
        id: config.id,
        poolId: config.poolId,
        type: config.type,
        configuration: config.configuration,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
    };
}
/**
 * Creates an immutable snapshot and calculates allocations when a transaction is paid.
 */
async function createSnapshotAndAllocationsForTransaction(poolId, transactionId) {
    const transaction = await prisma_1.prisma.transaction.findUnique({
        where: { id: transactionId },
    });
    if (!transaction || transaction.poolId !== poolId) {
        throw new errorHandler_1.AppError(404, 'Transaction not found for this pool', 'NOT_FOUND');
    }
    // Prevent duplicate snapshot
    const existingSnapshot = await prisma_1.prisma.splitSnapshot.findUnique({
        where: { transactionId },
    });
    if (existingSnapshot) {
        return existingSnapshot;
    }
    const splitConfig = await getSplitConfig(poolId);
    const members = await prisma_1.prisma.poolMember.findMany({
        where: { poolId },
        include: { user: true },
    });
    const memberPercentages = splitConfig.configuration.map((c) => ({
        memberId: c.memberId,
        percentage: c.percentage,
    }));
    const result = (0, splitEngine_1.calculateAllocations)({
        totalAmountMajor: Number(transaction.amount),
        splitType: splitConfig.type,
        members: memberPercentages,
    });
    const snapshot = await prisma_1.prisma.$transaction(async (tx) => {
        const newSnapshot = await tx.splitSnapshot.create({
            data: {
                poolId,
                transactionId,
                type: splitConfig.type,
                snapshotData: result,
                totalAmount: result.totalAmount,
                distributableAmount: result.distributableAmount,
            },
        });
        for (const alloc of result.allocations) {
            await tx.splitAllocation.create({
                data: {
                    snapshotId: newSnapshot.id,
                    poolMemberId: alloc.memberId,
                    percentage: alloc.percentage,
                    amount: alloc.amount,
                    currency: transaction.currency,
                    status: client_1.AllocationStatus.ALLOCATED,
                },
            });
            // Find user of this member for notification
            const member = members.find((m) => m.id === alloc.memberId);
            if (member) {
                await tx.notification.create({
                    data: {
                        userId: member.userId,
                        title: 'Payment Allocation Received',
                        message: `You were allocated ${transaction.currency} ${alloc.amount} from a confirmed payment.`,
                        type: 'PAYMENT_ALLOCATED',
                        data: { poolId, transactionId, amount: alloc.amount },
                    },
                });
            }
        }
        return newSnapshot;
    });
    return snapshot;
}
async function getPoolAllocations(poolId) {
    const allocations = await prisma_1.prisma.splitAllocation.findMany({
        where: {
            snapshot: { poolId },
        },
        include: {
            poolMember: {
                include: { user: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    return allocations.map((a) => ({
        id: a.id,
        snapshotId: a.snapshotId,
        poolMemberId: a.poolMemberId,
        percentage: Number(a.percentage),
        amount: Number(a.amount),
        currency: a.currency,
        status: a.status,
        createdAt: a.createdAt,
        member: {
            id: a.poolMember.id,
            role: a.poolMember.role,
            user: {
                id: a.poolMember.user.id,
                email: a.poolMember.user.email,
                fullName: a.poolMember.user.fullName,
                defaultCurrency: a.poolMember.user.defaultCurrency,
                createdAt: a.poolMember.user.createdAt,
            },
        },
    }));
}
async function getPoolBalance(poolId) {
    const pool = await prisma_1.prisma.pool.findUnique({
        where: { id: poolId },
        include: {
            members: {
                include: { user: true },
            },
        },
    });
    if (!pool) {
        throw new errorHandler_1.AppError(404, 'Pool not found', 'NOT_FOUND');
    }
    // Sum successful transactions
    const successfulTxs = await prisma_1.prisma.transaction.findMany({
        where: { poolId, status: client_1.PaymentStatus.SUCCESSFUL },
    });
    const totalReceived = successfulTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);
    // Sum split snapshots distributable amounts
    const snapshots = await prisma_1.prisma.splitSnapshot.findMany({
        where: { poolId },
    });
    const distributableAmount = snapshots.reduce((sum, s) => sum + Number(s.distributableAmount), 0);
    // All allocations for members
    const allAllocations = await prisma_1.prisma.splitAllocation.findMany({
        where: { snapshot: { poolId } },
    });
    // All withdrawals for members
    const withdrawals = await prisma_1.prisma.withdrawal.findMany({
        where: {
            poolId,
            status: { in: [client_1.WithdrawalStatus.SUCCESSFUL, client_1.WithdrawalStatus.PROCESSING, client_1.WithdrawalStatus.PENDING] },
        },
    });
    const totalWithdrawn = withdrawals
        .filter((w) => w.status === client_1.WithdrawalStatus.SUCCESSFUL)
        .reduce((sum, w) => sum + Number(w.amount), 0);
    const memberBalances = pool.members.map((member) => {
        const memberAllocated = allAllocations
            .filter((a) => a.poolMemberId === member.id)
            .reduce((sum, a) => sum + Number(a.amount), 0);
        const memberWithdrawn = withdrawals
            .filter((w) => w.poolMemberId === member.id && w.status !== client_1.WithdrawalStatus.FAILED && w.status !== client_1.WithdrawalStatus.REVERSED)
            .reduce((sum, w) => sum + Number(w.amount), 0);
        const availableBalance = Math.max(0, Math.round((memberAllocated - memberWithdrawn) * 100) / 100);
        return {
            poolMemberId: member.id,
            userId: member.userId,
            fullName: member.user.fullName,
            allocatedAmount: Math.round(memberAllocated * 100) / 100,
            withdrawnAmount: Math.round(memberWithdrawn * 100) / 100,
            availableBalance,
        };
    });
    const availableBalance = Math.max(0, Math.round((distributableAmount - totalWithdrawn) * 100) / 100);
    return {
        poolId: pool.id,
        currency: pool.currency,
        totalReceived: Math.round(totalReceived * 100) / 100,
        distributableAmount: Math.round(distributableAmount * 100) / 100,
        withdrawnAmount: Math.round(totalWithdrawn * 100) / 100,
        availableBalance,
        memberBalances,
    };
}
//# sourceMappingURL=service.js.map