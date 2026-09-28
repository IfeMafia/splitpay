"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestWithdrawal = requestWithdrawal;
exports.getPoolWithdrawals = getPoolWithdrawals;
exports.getWithdrawalById = getWithdrawalById;
const prisma_1 = require("../../lib/prisma");
const errorHandler_1 = require("../../middleware/errorHandler");
const service_1 = require("../splits/service");
const client_1 = require("@prisma/client");
const paystack_1 = require("../../lib/paystack");
async function requestWithdrawal(poolId, userId, dto) {
    const member = await prisma_1.prisma.poolMember.findUnique({
        where: {
            poolId_userId: {
                poolId,
                userId,
            },
        },
        include: { pool: true, user: true },
    });
    if (!member) {
        throw new errorHandler_1.AppError(403, 'You are not a member of this Pool', 'FORBIDDEN');
    }
    // Calculate member's current available balance
    const poolBalance = await (0, service_1.getPoolBalance)(poolId);
    const memberBalance = poolBalance.memberBalances.find((m) => m.poolMemberId === member.id);
    const available = memberBalance?.availableBalance ?? 0;
    if (dto.amount > available) {
        throw new errorHandler_1.AppError(400, `Requested amount (${member.pool.currency} ${dto.amount}) exceeds your available balance (${member.pool.currency} ${available})`, 'INSUFFICIENT_FUNDS');
    }
    // Create withdrawal record in PENDING state inside a transaction
    const withdrawal = await prisma_1.prisma.$transaction(async (tx) => {
        const newWithdrawal = await tx.withdrawal.create({
            data: {
                poolId,
                poolMemberId: member.id,
                amount: dto.amount,
                currency: member.pool.currency,
                status: client_1.WithdrawalStatus.PENDING,
                bankCode: dto.bankCode,
                accountNumber: dto.accountNumber,
                accountName: dto.accountName,
            },
        });
        await tx.withdrawalEvent.create({
            data: {
                withdrawalId: newWithdrawal.id,
                eventType: 'WITHDRAWAL_REQUESTED',
                data: {
                    requestedAmount: dto.amount,
                    currency: member.pool.currency,
                    bankCode: dto.bankCode,
                    accountNumber: dto.accountNumber,
                    accountName: dto.accountName,
                },
            },
        });
        await tx.notification.create({
            data: {
                userId,
                title: 'Withdrawal Requested',
                message: `Your withdrawal request of ${member.pool.currency} ${dto.amount} has been queued for processing.`,
                type: 'WITHDRAWAL_REQUESTED',
                data: { withdrawalId: newWithdrawal.id, poolId },
            },
        });
        await tx.auditLog.create({
            data: {
                entityType: 'WITHDRAWAL',
                entityId: newWithdrawal.id,
                action: 'WITHDRAWAL_REQUESTED',
                actorId: userId,
                metadata: {
                    poolId,
                    memberId: member.id,
                    amount: dto.amount,
                },
            },
        });
        return newWithdrawal;
    });
    // Initiate actual Paystack transfer outside transaction (non-atomic, handled via webhook)
    try {
        // 1. Create transfer recipient for the member's bank account
        const recipientCode = await (0, paystack_1.createPaystackTransferRecipient)({
            name: dto.accountName,
            accountNumber: dto.accountNumber,
            bankCode: dto.bankCode,
            currency: member.pool.currency,
        });
        // 2. Initiate the transfer (reference = withdrawal ID for webhook correlation)
        const transfer = await (0, paystack_1.initiatePaystackTransfer)({
            recipientCode,
            amountInNaira: dto.amount,
            reason: `SplitPay withdrawal — Pool: ${member.pool.name}`,
            reference: `wdr_${withdrawal.id}`,
        });
        // 3. Update withdrawal to PROCESSING with Paystack transfer reference
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.withdrawal.update({
                where: { id: withdrawal.id },
                data: {
                    status: client_1.WithdrawalStatus.PROCESSING,
                    providerReference: transfer.transferCode,
                },
            });
            await tx.withdrawalEvent.create({
                data: {
                    withdrawalId: withdrawal.id,
                    eventType: 'WITHDRAWAL_PROCESSING',
                    data: {
                        transferCode: transfer.transferCode,
                        reference: transfer.reference,
                        status: transfer.status,
                    },
                },
            });
            await tx.auditLog.create({
                data: {
                    entityType: 'WITHDRAWAL',
                    entityId: withdrawal.id,
                    action: 'WITHDRAWAL_PROCESSING',
                    actorId: userId,
                    metadata: {
                        transferCode: transfer.transferCode,
                        reference: transfer.reference,
                    },
                },
            });
        });
        return {
            id: withdrawal.id,
            poolId: withdrawal.poolId,
            poolMemberId: withdrawal.poolMemberId,
            amount: Number(withdrawal.amount),
            currency: withdrawal.currency,
            status: client_1.WithdrawalStatus.PROCESSING,
            providerReference: transfer.transferCode,
            bankCode: withdrawal.bankCode,
            accountNumber: withdrawal.accountNumber,
            accountName: withdrawal.accountName,
            failureReason: null,
            createdAt: withdrawal.createdAt,
        };
    }
    catch (transferError) {
        // If Paystack transfer initiation fails, mark the withdrawal as FAILED
        const failureReason = transferError instanceof Error ? transferError.message : 'Transfer initiation failed';
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.withdrawal.update({
                where: { id: withdrawal.id },
                data: {
                    status: client_1.WithdrawalStatus.FAILED,
                    failureReason,
                },
            });
            await tx.withdrawalEvent.create({
                data: {
                    withdrawalId: withdrawal.id,
                    eventType: 'WITHDRAWAL_FAILED',
                    data: { reason: failureReason },
                },
            });
            await tx.notification.create({
                data: {
                    userId,
                    title: 'Withdrawal Failed',
                    message: `Your withdrawal of ${member.pool.currency} ${dto.amount} could not be processed. Reason: ${failureReason}`,
                    type: 'WITHDRAWAL_FAILED',
                    data: { withdrawalId: withdrawal.id, poolId, reason: failureReason },
                },
            });
            await tx.auditLog.create({
                data: {
                    entityType: 'WITHDRAWAL',
                    entityId: withdrawal.id,
                    action: 'WITHDRAWAL_FAILED',
                    actorId: userId,
                    metadata: { reason: failureReason },
                },
            });
        });
        return {
            id: withdrawal.id,
            poolId: withdrawal.poolId,
            poolMemberId: withdrawal.poolMemberId,
            amount: Number(withdrawal.amount),
            currency: withdrawal.currency,
            status: client_1.WithdrawalStatus.FAILED,
            providerReference: null,
            bankCode: withdrawal.bankCode,
            accountNumber: withdrawal.accountNumber,
            accountName: withdrawal.accountName,
            failureReason,
            createdAt: withdrawal.createdAt,
        };
    }
}
async function getPoolWithdrawals(poolId, userId, userRole) {
    // If OWNER: can see all withdrawals in pool. If MEMBER: sees only their own withdrawals.
    let whereClause;
    if (userRole === client_1.PoolRole.OWNER) {
        whereClause = { poolId };
    }
    else {
        const member = await prisma_1.prisma.poolMember.findUnique({
            where: { poolId_userId: { poolId, userId } },
        });
        if (!member)
            throw new errorHandler_1.AppError(403, 'Forbidden', 'FORBIDDEN');
        whereClause = { poolId, poolMemberId: member.id };
    }
    const withdrawals = await prisma_1.prisma.withdrawal.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
    });
    return withdrawals.map((w) => ({
        id: w.id,
        poolId: w.poolId,
        poolMemberId: w.poolMemberId,
        amount: Number(w.amount),
        currency: w.currency,
        status: w.status,
        providerReference: w.providerReference,
        bankCode: w.bankCode,
        accountNumber: w.accountNumber,
        accountName: w.accountName,
        failureReason: w.failureReason,
        createdAt: w.createdAt,
    }));
}
async function getWithdrawalById(poolId, withdrawalId, userId, userRole) {
    const withdrawal = await prisma_1.prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: { poolMember: true },
    });
    if (!withdrawal || withdrawal.poolId !== poolId) {
        throw new errorHandler_1.AppError(404, 'Withdrawal request not found', 'NOT_FOUND');
    }
    if (userRole !== client_1.PoolRole.OWNER && withdrawal.poolMember.userId !== userId) {
        throw new errorHandler_1.AppError(403, 'Access denied', 'FORBIDDEN');
    }
    return {
        id: withdrawal.id,
        poolId: withdrawal.poolId,
        poolMemberId: withdrawal.poolMemberId,
        amount: Number(withdrawal.amount),
        currency: withdrawal.currency,
        status: withdrawal.status,
        providerReference: withdrawal.providerReference,
        bankCode: withdrawal.bankCode,
        accountNumber: withdrawal.accountNumber,
        accountName: withdrawal.accountName,
        failureReason: withdrawal.failureReason,
        createdAt: withdrawal.createdAt,
    };
}
//# sourceMappingURL=service.js.map