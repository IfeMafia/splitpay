import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { calculateAllocations } from './splitEngine';
import { ConfigureSplitDto } from './validators';
import {
  SplitConfigResponse,
  SplitAllocationResponse,
  PoolBalanceResponse,
} from '../../contracts';
import { SplitType, AllocationStatus, PaymentStatus, WithdrawalStatus, InvitationStatus, Prisma } from '@prisma/client';

export async function getSplitConfig(poolId: string): Promise<SplitConfigResponse> {
  const existingConfig = await prisma.splitConfiguration.findFirst({
    where: { poolId },
    orderBy: { updatedAt: 'desc' },
  });

  const members = await prisma.poolMember.findMany({
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
    configuration: existingConfig.configuration as unknown as SplitConfigResponse['configuration'],
    createdAt: existingConfig.createdAt,
    updatedAt: existingConfig.updatedAt,
  };
}

export async function configureSplit(
  poolId: string,
  userId: string,
  dto: ConfigureSplitDto,
): Promise<SplitConfigResponse> {
  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw new AppError(404, 'Pool not found', 'NOT_FOUND');
  if (pool.ownerId !== userId) {
    throw new AppError(403, 'Only the pool owner can configure or edit splits', 'FORBIDDEN');
  }

  const [members, invitations] = await Promise.all([
    prisma.poolMember.findMany({ where: { poolId } }),
    prisma.poolInvitation.findMany({
      where: { poolId, status: InvitationStatus.PENDING },
    }),
  ]);

  const memberIds = new Set([
    ...members.map((m) => m.id),
    ...members.map((m) => m.userId),
    ...invitations.map((i) => i.token),
    ...invitations.map((i) => i.id),
  ]);

  let finalConfig: { memberId: string; percentage: number }[] = [];

  if (dto.type === 'CUSTOM') {
    if (!dto.shares || dto.shares.length === 0) {
      throw new AppError(400, 'Custom shares configuration is required', 'BAD_REQUEST');
    }

    for (const share of dto.shares) {
      if (!memberIds.has(share.memberId)) {
        throw new AppError(400, `Member ${share.memberId} does not belong to this Pool`, 'INVALID_MEMBER');
      }
    }
    finalConfig = dto.shares;
  } else {
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

  const existing = await prisma.splitConfiguration.findFirst({
    where: { poolId },
  });

  let config;
  if (existing) {
    config = await prisma.splitConfiguration.update({
      where: { id: existing.id },
      data: {
        type: dto.type as SplitType,
        configuration: finalConfig,
      },
    });
  } else {
    config = await prisma.splitConfiguration.create({
      data: {
        poolId,
        type: dto.type as SplitType,
        configuration: finalConfig,
      },
    });
  }

  await prisma.auditLog.create({
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
    configuration: config.configuration as unknown as SplitConfigResponse['configuration'],
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

/**
 * Creates an immutable snapshot and calculates allocations when a transaction is paid.
 */
export async function createSnapshotAndAllocationsForTransaction(
  poolId: string,
  transactionId: string,
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.poolId !== poolId) {
    throw new AppError(404, 'Transaction not found for this pool', 'NOT_FOUND');
  }

  // Prevent duplicate snapshot
  const existingSnapshot = await prisma.splitSnapshot.findUnique({
    where: { transactionId },
  });
  if (existingSnapshot) {
    return existingSnapshot;
  }

  const splitConfig = await getSplitConfig(poolId);
  const members = await prisma.poolMember.findMany({
    where: { poolId },
    include: { user: true },
  });

  const memberPercentages = splitConfig.configuration.map((c) => ({
    memberId: c.memberId,
    percentage: c.percentage,
  }));

  const result = calculateAllocations({
    totalAmountMajor: Number(transaction.amount),
    splitType: splitConfig.type as SplitType,
    members: memberPercentages,
  });

  const snapshot = await prisma.$transaction(async (tx) => {
    const newSnapshot = await tx.splitSnapshot.create({
      data: {
        poolId,
        transactionId,
        type: splitConfig.type as SplitType,
        snapshotData: result as unknown as Prisma.InputJsonValue,
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
          status: AllocationStatus.ALLOCATED,
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

export async function getPoolAllocations(poolId: string): Promise<SplitAllocationResponse[]> {
  const allocations = await prisma.splitAllocation.findMany({
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

export async function getPoolBalance(poolId: string): Promise<PoolBalanceResponse> {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!pool) {
    throw new AppError(404, 'Pool not found', 'NOT_FOUND');
  }

  // Sum successful transactions
  const successfulTxs = await prisma.transaction.findMany({
    where: { poolId, status: PaymentStatus.SUCCESSFUL },
  });
  const totalReceived = successfulTxs.reduce((sum, tx) => sum + Number(tx.amount), 0);

  // Sum split snapshots distributable amounts
  const snapshots = await prisma.splitSnapshot.findMany({
    where: { poolId },
  });
  const distributableAmount = snapshots.reduce((sum, s) => sum + Number(s.distributableAmount), 0);

  // All allocations for members
  const allAllocations = await prisma.splitAllocation.findMany({
    where: { snapshot: { poolId } },
  });

  // All withdrawals for members
  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      poolId,
      status: { in: [WithdrawalStatus.SUCCESSFUL, WithdrawalStatus.PROCESSING, WithdrawalStatus.PENDING] },
    },
  });

  const totalWithdrawn = withdrawals
    .filter((w) => w.status === WithdrawalStatus.SUCCESSFUL)
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const memberBalances = pool.members.map((member) => {
    const memberAllocated = allAllocations
      .filter((a) => a.poolMemberId === member.id)
      .reduce((sum, a) => sum + Number(a.amount), 0);

    const memberWithdrawn = withdrawals
      .filter((w) => w.poolMemberId === member.id && w.status !== WithdrawalStatus.FAILED && w.status !== WithdrawalStatus.REVERSED)
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
