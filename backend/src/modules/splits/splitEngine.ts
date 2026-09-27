import { SplitType } from '@prisma/client';
import {
  calculatePaystackProviderFee,
  executeFinancialChain,
  DEFAULT_PAYSTACK_NGN_CONFIG,
} from './feeEngine';

export interface MemberPercentage {
  memberId: string;
  percentage?: number; // e.g. 50.00 for 50%
}

export interface CalculatedAllocation {
  memberId: string;
  percentage: number;
  amountMinor: number; // in minor units (kobo/cents)
  amount: number; // in major units (NGN/USD)
}

export interface SplitCalculationResult {
  totalAmount: number;
  feeAmount: number;
  distributableAmount: number;
  allocations: CalculatedAllocation[];
}

/**
 * Calculates Paystack collection fee for Nigerian local transactions.
 * 1.5% + ₦100 (flat ₦100 waived for transactions below ₦2,500, capped at ₦2,000).
 */
export function calculateProcessingFee(totalAmountMajor: number): number {
  const grossMinor = Math.round(totalAmountMajor * 100);
  const feeMinor = calculatePaystackProviderFee(grossMinor, DEFAULT_PAYSTACK_NGN_CONFIG);
  return feeMinor / 100;
}

/**
 * Pure function to calculate deterministic split allocations.
 * Converts to integer minor units (kobo/cents) to prevent any floating point drift.
 */
export function calculateAllocations({
  totalAmountMajor,
  splitType,
  members,
  feeAmountMajor,
}: {
  totalAmountMajor: number;
  splitType: SplitType;
  members: MemberPercentage[];
  feeAmountMajor?: number;
}): SplitCalculationResult {
  if (members.length === 0) {
    throw new Error('At least one member is required to calculate splits');
  }

  const grossMinor = Math.round(totalAmountMajor * 100);
  const feeMinor =
    feeAmountMajor !== undefined
      ? Math.round(feeAmountMajor * 100)
      : calculatePaystackProviderFee(grossMinor, DEFAULT_PAYSTACK_NGN_CONFIG);

  // Validate percentages if custom
  if (splitType === SplitType.CUSTOM) {
    const totalPercentage = members.reduce((sum, m) => sum + (m.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Custom split percentages must sum to 100%. Current sum: ${totalPercentage}%`);
    }
  }

  const equalPercentage = members.length > 0 ? Math.round((100 / members.length) * 100) / 100 : 0;

  const collaborators = members.map((m) => ({
    id: m.memberId,
    userId: null,
    role: 'MEMBER',
    splitPercentage: splitType === SplitType.CUSTOM ? (m.percentage || 0) : equalPercentage,
  }));

  const chain = executeFinancialChain({
    grossAmountMinor: grossMinor,
    authoritativeProviderFeeMinor: feeMinor,
    platformFeePercent: 0,
    collaborators,
  });

  return {
    totalAmount: totalAmountMajor,
    feeAmount: chain.providerFee,
    distributableAmount: chain.distributableAmount,
    allocations: chain.collaboratorAllocations.map((a) => ({
      memberId: a.collaboratorId,
      percentage: a.splitPercentage,
      amountMinor: a.amountMinor,
      amount: a.amount,
    })),
  };
}
