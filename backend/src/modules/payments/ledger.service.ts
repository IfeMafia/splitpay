import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { verifyPaystackTransaction } from '../../lib/paystack';
import { Prisma } from '@prisma/client';

export interface FinancialChainBreakdown {
  grossAmount: number;
  providerFee: number;
  platformFee: number;
  tax: number;
  distributableAmount: number;
  collaboratorAllocations: Array<{
    collaboratorId: string;
    userId: string | null;
    role: string;
    splitPercentage: number;
    amount: number;
  }>;
}

/**
 * Calculates the exact financial chain values using integer minor-unit arithmetic (kobo).
 */
export function calculateFinancialChain(
  grossAmountNaira: number,
  platformFeePercent: number = 0,
  providerFeeNaira: number = 0,
  collaborators: Array<{
    id: string;
    userId: string | null;
    role: string;
    splitPercentage: number | Prisma.Decimal | any;
  }>
): FinancialChainBreakdown {
  // Convert all currency amounts to kobo (integer minor units)
  const grossKobo = Math.round(grossAmountNaira * 100);
  const providerFeeKobo = Math.round(providerFeeNaira * 100);
  const platformFeeKobo = Math.round(grossKobo * (platformFeePercent / 100));
  const taxKobo = 0;

  const distributableKobo = Math.max(0, grossKobo - providerFeeKobo - platformFeeKobo - taxKobo);

  let allocatedKoboSum = 0;
  const allocations = collaborators.map((c, idx) => {
    const splitPct = typeof c.splitPercentage === 'number' ? c.splitPercentage : Number(c.splitPercentage);
    let allocKobo = Math.floor(distributableKobo * (splitPct / 100));
    
    // For the last collaborator, assign remaining minor units to guarantee 100% total allocation
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
 * Authoritative Payment Confirmation & State Machine Execution.
 * Guarantees idempotency and executes the financial chain in a single database transaction.
 */
export async function confirmPaymentTransaction(reference: string): Promise<{ payment: any; breakdown: FinancialChainBreakdown }> {
  // 1. Find payment record by providerReference or paymentLinkToken
  let payment = await prisma.payment.findFirst({
    where: {
      OR: [{ providerReference: reference }, { paymentLinkToken: reference }],
    },
    include: {
      project: {
        include: {
          collaborators: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, `Payment with reference ${reference} not found`, 'NOT_FOUND');
  }

  // Idempotency Check: If already successful, return early without re-running calculations
  if (payment.status === 'SUCCESSFUL') {
    const existingSnapshot = await prisma.splitSnapshot.findUnique({
      where: { paymentId: payment.id },
    });
    return {
      payment,
      breakdown: (existingSnapshot?.snapshotData as any) || {},
    };
  }

  // 2. Perform authoritative verification with Paystack
  const verifyData = await verifyPaystackTransaction(reference);

  if (verifyData.status !== 'success') {
    // Update payment status to FAILED if Paystack reports failure
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', providerReference: reference },
    });
    throw new AppError(400, `Payment verification failed with status: ${verifyData.status}`, 'PAYMENT_FAILED');
  }

  const grossAmount = verifyData.amountInNaira || Number(payment.expectedAmount);
  const platformFeePct = payment.project.platformFeePercent ? Number(payment.project.platformFeePercent) : 0;
  const providerFee = verifyData.feesInNaira || (grossAmount * 0.015);

  // 3. Calculate Financial Chain & Allocations
  const breakdown = calculateFinancialChain(
    grossAmount,
    platformFeePct,
    providerFee,
    payment.project.collaborators
  );

  // 4. Atomic Execution via Prisma Transaction
  const result = await prisma.$transaction(async (tx) => {
    // A. Update Payment Record to SUCCESSFUL
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESSFUL',
        actualAmount: breakdown.grossAmount,
        providerReference: reference,
        paidAt: verifyData.paidAt ? new Date(verifyData.paidAt) : new Date(),
      },
    });

    // B. Freeze SplitSnapshot
    await tx.splitSnapshot.create({
      data: {
        projectId: payment.projectId,
        paymentId: payment.id,
        snapshotData: breakdown as unknown as Prisma.InputJsonValue,
      },
    });

    // C. Create PayoutTransaction entries for each collaborator
    for (const alloc of breakdown.collaboratorAllocations) {
      await tx.payoutTransaction.create({
        data: {
          paymentId: payment.id,
          collaboratorId: alloc.collaboratorId,
          amount: alloc.amount,
          currency: payment.currency,
          status: 'PENDING',
        },
      });
    }

    // D. Update ProjectAccount ledger balance
    await tx.projectAccount.upsert({
      where: { projectId: payment.projectId },
      create: {
        projectId: payment.projectId,
        totalReceived: breakdown.grossAmount,
        currentBalance: breakdown.distributableAmount,
        currency: payment.currency,
      },
      update: {
        totalReceived: { increment: breakdown.grossAmount },
        currentBalance: { increment: breakdown.distributableAmount },
      },
    });

    // E. Log immutable ledger entry in AuditLog
    await tx.auditLog.create({
      data: {
        entityType: 'LEDGER_ENTRY',
        entityId: payment.id,
        action: 'PAYMENT_CONFIRMED',
        metadata: {
          reference,
          projectId: payment.projectId,
          financialChain: breakdown,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return updatedPayment;
  });

  return { payment: result, breakdown };
}
