import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { verifyPaystackTransaction } from '../../lib/paystack';
import { PaymentStatus, SplitType, Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { sendEmail } from '../../lib/mailer';
import {
  formatPaymentReceivedOwnerEmail,
  formatPaymentAllocatedEmail,
  formatPaymentReceiptClientEmail,
} from '../../lib/emailTemplates';
import {
  executeFinancialChain,
  DetailedFinancialChain,
  DEFAULT_PAYSTACK_NGN_CONFIG,
  toMinorUnits,
} from '../splits/feeEngine';

export interface FinancialChainBreakdown {
  grossAmountMinor: number;
  grossAmount: number;
  providerFeeMinor: number;
  providerFee: number;
  platformFeeMinor: number;
  platformFee: number;
  platformFeePercent: number;
  taxMinor: number;
  tax: number;
  distributableAmountMinor: number;
  distributableAmount: number;
  collaboratorAllocations: Array<{
    collaboratorId: string;
    userId: string | null;
    role: string;
    splitPercentage: number;
    amountMinor: number;
    amount: number;
  }>;
}

/**
 * Calculates the exact financial chain values using integer minor-unit arithmetic (kobo).
 * Pure function with guaranteed invariants.
 */
export function calculateFinancialChain(
  grossAmountNaira: number,
  platformFeePercent: number = Number(process.env.PLATFORM_FEE_PERCENT || 0),
  providerFeeNaira?: number,
  collaborators: Array<{
    id: string;
    userId: string | null;
    role: string;
    splitPercentage: number | Prisma.Decimal | any;
  }> = []
): FinancialChainBreakdown {
  const grossKobo = Math.round(grossAmountNaira * 100);
  const providerFeeKobo = providerFeeNaira !== undefined ? Math.round(providerFeeNaira * 100) : undefined;

  const collabList = collaborators.map((c) => ({
    id: c.id,
    userId: c.userId,
    role: c.role,
    splitPercentage: typeof c.splitPercentage === 'number' ? c.splitPercentage : Number(c.splitPercentage),
  }));

  const result = executeFinancialChain({
    grossAmountMinor: grossKobo,
    platformFeePercent,
    authoritativeProviderFeeMinor: providerFeeKobo,
    collaborators: collabList,
  });

  return {
    grossAmountMinor: result.grossAmountMinor,
    grossAmount: result.grossAmount,
    providerFeeMinor: result.providerFeeMinor,
    providerFee: result.providerFee,
    platformFeeMinor: result.platformFeeMinor,
    platformFee: result.platformFee,
    platformFeePercent: result.platformFeePercent,
    taxMinor: result.taxMinor,
    tax: result.tax,
    distributableAmountMinor: result.distributableAmountMinor,
    distributableAmount: result.distributableAmount,
    collaboratorAllocations: result.collaboratorAllocations,
  };
}

/**
 * Authoritative Payment Confirmation & State Machine.
 * Shared by webhook and verify endpoints with strict idempotency and audit logs.
 */
export async function confirmPaymentTransaction(
  reference: string
): Promise<{ payment: any; breakdown: FinancialChainBreakdown }> {
  // 1. Find the Transaction by providerReference
  const transaction = await prisma.transaction.findUnique({
    where: { providerReference: reference },
    include: {
      paymentLink: true,
      pool: {
        select: {
          id: true,
          name: true,
          currency: true,
          ownerId: true,
          owner: { select: { id: true, email: true, fullName: true } },
          members: { include: { user: true } },
        },
      },
      splitSnapshot: { include: { allocations: true } },
      platformFee: true,
    },
  });

  if (!transaction) {
    throw new AppError(404, 'Transaction not found for this reference', 'NOT_FOUND');
  }

  // 2. Idempotency Guard: if already confirmed, return persisted breakdown
  if (transaction.status === PaymentStatus.SUCCESSFUL && transaction.splitSnapshot) {
    const snapshot = transaction.splitSnapshot;
    const grossMinor = snapshot.grossAmountMinor
      ? Number(snapshot.grossAmountMinor)
      : Math.round(Number(snapshot.totalAmount) * 100);
    const providerFeeMinor = snapshot.providerFeeMinor
      ? Number(snapshot.providerFeeMinor)
      : (snapshot.providerFee ? Math.round(Number(snapshot.providerFee) * 100) : 0);
    const platformFeeMinor = snapshot.platformFeeMinor
      ? Number(snapshot.platformFeeMinor)
      : (snapshot.platformFee ? Math.round(Number(snapshot.platformFee) * 100) : (transaction.platformFee ? Number(transaction.platformFee.amountMinor) : 0));
    const taxMinor = snapshot.taxMinor ? Number(snapshot.taxMinor) : 0;
    const distributableMinor = snapshot.distributableAmountMinor
      ? Number(snapshot.distributableAmountMinor)
      : Math.round(Number(snapshot.distributableAmount) * 100);

    const breakdown: FinancialChainBreakdown = {
      grossAmountMinor: grossMinor,
      grossAmount: grossMinor / 100,
      providerFeeMinor,
      providerFee: providerFeeMinor / 100,
      platformFeeMinor,
      platformFee: platformFeeMinor / 100,
      platformFeePercent: snapshot.platformFeePercent ? Number(snapshot.platformFeePercent) : (transaction.platformFee ? Number(transaction.platformFee.feePercent) : 0),
      taxMinor,
      tax: taxMinor / 100,
      distributableAmountMinor: distributableMinor,
      distributableAmount: distributableMinor / 100,
      collaboratorAllocations: snapshot.allocations.map((a) => {
        const allocMinor = a.amountMinor ? Number(a.amountMinor) : Math.round(Number(a.amount) * 100);
        return {
          collaboratorId: a.poolMemberId,
          userId: null,
          role: 'Collaborator',
          splitPercentage: Number(a.percentage),
          amountMinor: allocMinor,
          amount: allocMinor / 100,
        };
      }),
    };

    return {
      payment: {
        id: transaction.id,
        status: 'SUCCESSFUL',
        actualAmount: Number(transaction.amount).toFixed(2),
        currency: transaction.currency,
        paidAt: transaction.paidAt,
        reference: transaction.providerReference,
        poolName: transaction.pool.name,
        description: transaction.paymentLink?.description || transaction.pool.name,
        merchantName: transaction.pool.owner?.fullName || 'Verified Splitpay Merchant',
        payerEmail: transaction.payerEmail,
        channel: 'Paystack Gateway',
      },
      breakdown,
    };
  }

  // 3. Verify with Paystack
  const paystackData = await verifyPaystackTransaction(reference);
  const isSuccess = paystackData.status === 'success';

  if (!isSuccess) {
    // Mark transaction as failed
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: PaymentStatus.FAILED },
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
  const splitConfig = await prisma.splitConfiguration.findFirst({
    where: { poolId: transaction.poolId },
    orderBy: { updatedAt: 'desc' },
  });

  const configuredType = splitConfig?.type ?? SplitType.EQUAL;
  const equalSplit = members.length > 0 ? Math.round((100 / members.length) * 100) / 100 : 0;
  let snapshotType: SplitType = SplitType.EQUAL;
  let collaboratorsForCalc = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    splitPercentage: equalSplit,
  }));

  if (configuredType === SplitType.CUSTOM && splitConfig && Array.isArray(splitConfig.configuration) && members.length > 0) {
    const shareMap = new Map<string, number>();
    for (const item of splitConfig.configuration as any[]) {
      if (!item || !item.memberId || item.percentage === undefined) continue;
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
      snapshotType = SplitType.CUSTOM;
      collaboratorsForCalc = customCollaborators;
    }
  }

  const configuredPlatformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT || 0);

  const breakdown = calculateFinancialChain(
    paystackData.amountInNaira,
    configuredPlatformFeePercent,
    paystackData.feesInNaira,
    collaboratorsForCalc
  );

  // 5. Atomic database transaction
  await prisma.$transaction(async (tx) => {
    // A. Update transaction
    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: PaymentStatus.SUCCESSFUL,
        amount: breakdown.grossAmount,
        amountMinor: BigInt(breakdown.grossAmountMinor),
        payerEmail: paystackData.customerEmail,
        paidAt: paystackData.paidAt ? new Date(paystackData.paidAt) : new Date(),
      },
    });

    // B. Record SplitPay platform fee record if applicable
    if (breakdown.platformFeeMinor > 0) {
      await tx.platformFee.create({
        data: {
          transactionId: transaction.id,
          poolId: transaction.poolId,
          grossAmountMinor: BigInt(breakdown.grossAmountMinor),
          feePercent: new Prisma.Decimal(breakdown.platformFeePercent),
          amountMinor: BigInt(breakdown.platformFeeMinor),
          amount: new Prisma.Decimal(breakdown.platformFee),
          currency: transaction.currency,
          status: PaymentStatus.SUCCESSFUL,
        },
      });
    }

    // C. Create SplitSnapshot (immutable freeze with minor units)
    const snapshot = await tx.splitSnapshot.create({
      data: {
        poolId: transaction.poolId,
        transactionId: transaction.id,
        type: snapshotType,
        snapshotData: collaboratorsForCalc as any,
        totalAmount: new Prisma.Decimal(breakdown.grossAmount),
        distributableAmount: new Prisma.Decimal(breakdown.distributableAmount),
        grossAmountMinor: BigInt(breakdown.grossAmountMinor),
        providerFeeMinor: BigInt(breakdown.providerFeeMinor),
        platformFeeMinor: BigInt(breakdown.platformFeeMinor),
        taxMinor: BigInt(breakdown.taxMinor),
        distributableAmountMinor: BigInt(breakdown.distributableAmountMinor),
        platformFeePercent: new Prisma.Decimal(breakdown.platformFeePercent),
        providerFee: new Prisma.Decimal(breakdown.providerFee),
        platformFee: new Prisma.Decimal(breakdown.platformFee),
        tax: new Prisma.Decimal(breakdown.tax),
        calculationVersion: 'v2',
      },
    });

    // D. Create SplitAllocations with minor units
    if (members.length > 0) {
      await tx.splitAllocation.createMany({
        data: breakdown.collaboratorAllocations.map((a) => ({
          snapshotId: snapshot.id,
          poolMemberId: a.collaboratorId,
          percentage: new Prisma.Decimal(a.splitPercentage),
          amount: new Prisma.Decimal(a.amount),
          amountMinor: BigInt(a.amountMinor),
          currency: transaction.currency,
        })),
      });
    }

    // E. Mark payment link inactive
    if (transaction.paymentLinkId) {
      await tx.paymentLink.update({
        where: { id: transaction.paymentLinkId },
        data: { isActive: false },
      });
    }

    // F. Audit logs
    await tx.auditLog.create({
      data: {
        entityType: 'TRANSACTION',
        entityId: transaction.id,
        action: 'PAYMENT_VERIFIED',
        metadata: {
          reference,
          grossAmount: breakdown.grossAmount,
          providerFee: breakdown.providerFee,
          platformFee: breakdown.platformFee,
          distributableAmount: breakdown.distributableAmount,
        },
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: 'SPLIT_SNAPSHOT',
        entityId: snapshot.id,
        action: 'SPLIT_SNAPSHOT_CREATED',
        metadata: {
          poolId: transaction.poolId,
          transactionId: transaction.id,
          allocationsCount: breakdown.collaboratorAllocations.length,
        },
      },
    });
  });

  // 6. Asynchronous Notification & Email Dispatch (after DB commit)
  try {
    const poolName = transaction.pool.name;

    // In-app notification to Owner
    await prisma.notification.create({
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

    // In-app notifications to Collaborators
    for (const alloc of breakdown.collaboratorAllocations) {
      if (alloc.userId && alloc.userId !== transaction.pool.ownerId) {
        await prisma.notification.create({
          data: {
            userId: alloc.userId,
            title: 'Payment Allocated',
            message: `₦${alloc.amount.toLocaleString()} has been allocated to you from "${poolName}".`,
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
  } catch (notifErr) {
    console.error('[Notification Warning] Failed to dispatch in-app notifications:', notifErr);
  }

  // Email dispatch
  try {
    const poolName = transaction.pool.name;
    const poolUrl = `${env.FRONTEND_URL}/dashboard/pools/${transaction.poolId}`;

    // A. Email to Owner
    if (transaction.pool.owner?.email) {
      const ownerEmail = formatPaymentReceivedOwnerEmail({
        ownerName: transaction.pool.owner.fullName || transaction.pool.owner.email,
        poolName,
        amount: breakdown.grossAmount,
        currency: transaction.currency,
        reference,
        paidAt: paystackData.paidAt || new Date(),
        poolUrl,
      });
      await sendEmail({
        to: transaction.pool.owner.email,
        subject: ownerEmail.subject,
        html: ownerEmail.html,
        text: ownerEmail.text,
      });
    }

    // B. Emails to Collaborators
    for (const alloc of breakdown.collaboratorAllocations) {
      if (alloc.userId && alloc.userId !== transaction.pool.ownerId) {
        const memberUser = members.find((m) => m.id === alloc.collaboratorId || m.userId === alloc.userId)?.user;
        if (memberUser?.email) {
          const collabEmail = formatPaymentAllocatedEmail({
            collaboratorName: memberUser.fullName || memberUser.email,
            poolName,
            grossAmount: breakdown.grossAmount,
            splitPercentage: alloc.splitPercentage,
            allocatedAmount: alloc.amount,
            currency: transaction.currency,
            reference,
            poolUrl,
          });
          await sendEmail({
            to: memberUser.email,
            subject: collabEmail.subject,
            html: collabEmail.html,
            text: collabEmail.text,
          });
        }
      }
    }

    // C. Payment Receipt to Paying Client
    const clientEmail = paystackData.customerEmail || transaction.payerEmail;
    if (clientEmail) {
      const receiptEmail = formatPaymentReceiptClientEmail({
        poolName,
        description: transaction.paymentLink?.description || undefined,
        amount: breakdown.grossAmount,
        currency: transaction.currency,
        reference,
        paidAt: paystackData.paidAt || new Date(),
      });
      await sendEmail({
        to: clientEmail,
        subject: receiptEmail.subject,
        html: receiptEmail.html,
        text: receiptEmail.text,
      });
    }
  } catch (emailErr) {
    console.error('[Mailer Warning] Failed to dispatch transactional emails:', emailErr);
  }

  return {
    payment: {
      id: transaction.id,
      status: 'SUCCESSFUL',
      actualAmount: paystackData.amountInNaira.toFixed(2),
      currency: transaction.currency,
      paidAt: paystackData.paidAt ?? new Date().toISOString(),
      reference,
      poolName: transaction.pool.name,
      description: transaction.paymentLink?.description || transaction.pool.name,
      merchantName: transaction.pool.owner?.fullName || 'Verified Splitpay Merchant',
      payerEmail: paystackData.customerEmail || transaction.payerEmail,
      channel: 'Paystack Gateway',
    },
    breakdown,
  };
}

/**
 * Calculates SplitPay platform revenue and financial metrics independently from pool balances.
 */
export async function getPlatformRevenueSummary(params?: {
  startDate?: Date;
  endDate?: Date;
  poolId?: string;
}) {
  const whereTx: Prisma.TransactionWhereInput = {
    status: PaymentStatus.SUCCESSFUL,
    ...(params?.poolId ? { poolId: params.poolId } : {}),
    ...(params?.startDate || params?.endDate
      ? {
          paidAt: {
            ...(params.startDate ? { gte: params.startDate } : {}),
            ...(params.endDate ? { lte: params.endDate } : {}),
          },
        }
      : {}),
  };

  const [transactions, snapshots, platformFees, withdrawals] = await Promise.all([
    prisma.transaction.findMany({ where: whereTx }),
    prisma.splitSnapshot.findMany({
      where: params?.poolId ? { poolId: params.poolId } : {},
      include: { allocations: true },
    }),
    prisma.platformFee.findMany({
      where: params?.poolId ? { poolId: params.poolId } : {},
    }),
    prisma.withdrawal.findMany({
      where: {
        status: 'SUCCESSFUL',
        ...(params?.poolId ? { poolId: params.poolId } : {}),
      },
    }),
  ]);

  const grossPaymentVolumeMinor = transactions.reduce(
    (sum, tx) => sum + toMinorUnits(tx.amountMinor, tx.amount),
    0,
  );

  const totalProviderFeesMinor = snapshots.reduce(
    (sum, s) => sum + toMinorUnits(s.providerFeeMinor, s.providerFee),
    0,
  );

  const totalPlatformRevenueMinor = platformFees.reduce((sum, f) => {
    return sum + Number(f.amountMinor);
  }, 0);

  const totalTaxMinor = snapshots.reduce(
    (sum, s) => sum + toMinorUnits(s.taxMinor, s.tax),
    0,
  );

  const netDistributableVolumeMinor = snapshots.reduce(
    (sum, s) => sum + toMinorUnits(s.distributableAmountMinor, s.distributableAmount),
    0,
  );

  const totalMemberAllocationsMinor = snapshots.reduce((sum, s) => {
    return (
      sum +
      s.allocations.reduce((aSum, a) => aSum + toMinorUnits(a.amountMinor, a.amount), 0)
    );
  }, 0);

  const totalWithdrawalsMinor = withdrawals.reduce(
    (sum, w) => sum + toMinorUnits(w.amountMinor, w.amount),
    0,
  );

  return {
    grossPaymentVolume: grossPaymentVolumeMinor / 100,
    grossPaymentVolumeMinor,
    totalProviderFees: totalProviderFeesMinor / 100,
    totalProviderFeesMinor,
    totalPlatformRevenue: totalPlatformRevenueMinor / 100,
    totalPlatformRevenueMinor,
    totalTax: totalTaxMinor / 100,
    totalTaxMinor,
    netDistributableVolume: netDistributableVolumeMinor / 100,
    netDistributableVolumeMinor,
    totalMemberAllocations: totalMemberAllocationsMinor / 100,
    totalMemberAllocationsMinor,
    totalWithdrawals: totalWithdrawalsMinor / 100,
    totalWithdrawalsMinor,
  };
}
