import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { calculateAllocations } from './splitEngine';
import { toMinorUnits, calculateMemberAvailableBalanceMinor } from './feeEngine';
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

  // 1. Sum successful transactions (gross received)
  const successfulTxs = await prisma.transaction.findMany({
    where: { poolId, status: PaymentStatus.SUCCESSFUL },
  });
  const totalGrossReceivedMinor = successfulTxs.reduce(
    (sum, tx) => sum + toMinorUnits(tx.amountMinor, tx.amount),
    0,
  );

  // 2. Sum split snapshots (provider fees, platform fees, tax, distributable)
  const snapshots = await prisma.splitSnapshot.findMany({
    where: { poolId },
  });

  const totalProviderFeesMinor = snapshots.reduce(
    (sum, s) => sum + toMinorUnits(s.providerFeeMinor, s.providerFee),
    0,
  );

  const totalPlatformFeesMinor = snapshots.reduce(
    (sum, s) => sum + toMinorUnits(s.platformFeeMinor, s.platformFee),
    0,
  );

  const totalTaxMinor = snapshots.reduce(
    (sum, s) => sum + toMinorUnits(s.taxMinor, s.tax),
    0,
  );

  const totalDistributableMinor = snapshots.reduce(
    (sum, s) => sum + toMinorUnits(s.distributableAmountMinor, s.distributableAmount),
    0,
  );

  // 3. All allocations for members
  const allAllocations = await prisma.splitAllocation.findMany({
    where: { snapshot: { poolId } },
  });

  const totalAllocatedMinor = allAllocations.reduce(
    (sum, a) => sum + toMinorUnits(a.amountMinor, a.amount),
    0,
  );

  // 4. Withdrawals
  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      poolId,
      status: { in: [WithdrawalStatus.SUCCESSFUL, WithdrawalStatus.PROCESSING, WithdrawalStatus.PENDING] },
    },
  });

  const totalWithdrawnMinor = withdrawals
    .filter((w) => w.status === WithdrawalStatus.SUCCESSFUL)
    .reduce((sum, w) => sum + toMinorUnits(w.amountMinor, w.amount), 0);

  const totalPendingWithdrawalsMinor = withdrawals
    .filter((w) => w.status === WithdrawalStatus.PENDING || w.status === WithdrawalStatus.PROCESSING)
    .reduce((sum, w) => sum + toMinorUnits(w.amountMinor, w.amount), 0);

  // 5. Calculate per-member balances
  const memberBalances = pool.members.map((member) => {
    const memberAllocatedMinor = allAllocations
      .filter((a) => a.poolMemberId === member.id)
      .reduce((sum, a) => sum + toMinorUnits(a.amountMinor, a.amount), 0);

    const memberWithdrawnMinor = withdrawals
      .filter((w) => w.poolMemberId === member.id && w.status === WithdrawalStatus.SUCCESSFUL)
      .reduce((sum, w) => sum + toMinorUnits(w.amountMinor, w.amount), 0);

    const memberPendingMinor = withdrawals
      .filter(
        (w) =>
          w.poolMemberId === member.id &&
          (w.status === WithdrawalStatus.PENDING || w.status === WithdrawalStatus.PROCESSING),
      )
      .reduce((sum, w) => sum + toMinorUnits(w.amountMinor, w.amount), 0);

    const availableMinor = calculateMemberAvailableBalanceMinor(
      memberAllocatedMinor,
      memberWithdrawnMinor,
      memberPendingMinor,
    );

    return {
      poolMemberId: member.id,
      userId: member.userId,
      fullName: member.user.fullName,
      allocatedAmount: memberAllocatedMinor / 100,
      withdrawnAmount: memberWithdrawnMinor / 100,
      pendingWithdrawalAmount: memberPendingMinor / 100,
      availableBalance: availableMinor / 100,
    };
  });

  const totalAvailableMinor = Math.max(
    0,
    totalDistributableMinor - totalWithdrawnMinor - totalPendingWithdrawalsMinor,
  );

  return {
    poolId: pool.id,
    currency: pool.currency,
    totalGrossReceived: totalGrossReceivedMinor / 100,
    totalProviderFees: totalProviderFeesMinor / 100,
    totalPlatformFees: totalPlatformFeesMinor / 100,
    totalTax: totalTaxMinor / 100,
    totalDistributable: totalDistributableMinor / 100,
    totalAllocated: totalAllocatedMinor / 100,
    totalWithdrawn: totalWithdrawnMinor / 100,
    totalPendingWithdrawals: totalPendingWithdrawalsMinor / 100,
    totalAvailable: totalAvailableMinor / 100,
    // Backward compatibility aliases
    totalReceived: totalGrossReceivedMinor / 100,
    distributableAmount: totalDistributableMinor / 100,
    withdrawnAmount: totalWithdrawnMinor / 100,
    availableBalance: totalAvailableMinor / 100,
    memberBalances,
  };
}
