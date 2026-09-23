import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { getPoolBalance } from '../splits/service';
import { RequestWithdrawalDto } from './validators';
import { WithdrawalResponse } from '../../contracts';
import { WithdrawalStatus, PoolRole } from '@prisma/client';

export async function requestWithdrawal(
  poolId: string,
  userId: string,
  dto: RequestWithdrawalDto,
): Promise<WithdrawalResponse> {
  const member = await prisma.poolMember.findUnique({
    where: {
      poolId_userId: {
        poolId,
        userId,
      },
    },
    include: { pool: true },
  });

  if (!member) {
    throw new AppError(403, 'You are not a member of this Pool', 'FORBIDDEN');
  }

  // Calculate member's current available balance
  const poolBalance = await getPoolBalance(poolId);
  const memberBalance = poolBalance.memberBalances.find((m) => m.poolMemberId === member.id);

  const available = memberBalance?.availableBalance ?? 0;
  if (dto.amount > available) {
    throw new AppError(
      400,
      `Requested amount (${member.pool.currency} ${dto.amount}) exceeds your available balance (${member.pool.currency} ${available})`,
      'INSUFFICIENT_FUNDS',
    );
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    const newWithdrawal = await tx.withdrawal.create({
      data: {
        poolId,
        poolMemberId: member.id,
        amount: dto.amount,
        currency: member.pool.currency,
        status: WithdrawalStatus.PENDING,
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
        message: `Your withdrawal request of ${member.pool.currency} ${dto.amount} has been queued.`,
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

export async function getPoolWithdrawals(
  poolId: string,
  userId: string,
  userRole: PoolRole,
): Promise<WithdrawalResponse[]> {
  // If OWNER: can see all withdrawals in pool. If MEMBER: sees only their own withdrawals.
  let whereClause;
  if (userRole === PoolRole.OWNER) {
    whereClause = { poolId };
  } else {
    const member = await prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId } },
    });
    if (!member) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
    whereClause = { poolId, poolMemberId: member.id };
  }

  const withdrawals = await prisma.withdrawal.findMany({
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

export async function getWithdrawalById(
  poolId: string,
  withdrawalId: string,
  userId: string,
  userRole: PoolRole,
): Promise<WithdrawalResponse> {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { poolMember: true },
  });

  if (!withdrawal || withdrawal.poolId !== poolId) {
    throw new AppError(404, 'Withdrawal request not found', 'NOT_FOUND');
  }

  if (userRole !== PoolRole.OWNER && withdrawal.poolMember.userId !== userId) {
    throw new AppError(403, 'Access denied', 'FORBIDDEN');
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
