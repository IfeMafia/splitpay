import { SplitType } from '@prisma/client';

export interface ProviderPricingConfig {
  percentageRate: number; // e.g. 0.015 for 1.5%
  flatFeeMinor: number; // e.g. 10000 kobo (₦100)
  feeCapMinor: number; // e.g. 200000 kobo (₦2,000)
  flatFeeWaiverThresholdMinor: number; // e.g. 250000 kobo (₦2,500)
  currency: string;
  isInternational?: boolean;
}

export const DEFAULT_PAYSTACK_NGN_CONFIG: ProviderPricingConfig = {
  percentageRate: 0.015,
  flatFeeMinor: 10000, // ₦100
  feeCapMinor: 200000, // ₦2,000 max cap
  flatFeeWaiverThresholdMinor: 250000, // ₦2,500
  currency: 'NGN',
  isInternational: false,
};

export interface FinancialChainParams {
  grossAmountMinor: number | bigint;
  platformFeePercent?: number; // e.g. 5 for 5%
  authoritativeProviderFeeMinor?: number | bigint | null;
  pricingConfig?: ProviderPricingConfig;
  taxMinor?: number | bigint;
  collaborators: Array<{
    id: string;
    userId: string | null;
    role: string;
    splitPercentage: number;
  }>;
  currency?: string;
}

export interface MemberAllocationMinor {
  collaboratorId: string;
  userId: string | null;
  role: string;
  splitPercentage: number;
  amountMinor: number;
  amount: number;
}

export interface DetailedFinancialChain {
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
  currency: string;
  collaboratorAllocations: MemberAllocationMinor[];
}

/**
 * Calculates Paystack provider collection fee in integer minor units (kobo).
 * Formula:
 * - 1.5% + ₦100
 * - Flat ₦100 is waived for transactions below ₦2,500
 * - Capped at ₦2,000
 */
export function calculatePaystackProviderFee(
  grossAmountMinor: number | bigint,
  config: ProviderPricingConfig = DEFAULT_PAYSTACK_NGN_CONFIG,
): number {
  const gross = Number(grossAmountMinor);
  if (gross <= 0) return 0;

  const percentageComponent = Math.round(gross * config.percentageRate);
  const flatComponent = gross < config.flatFeeWaiverThresholdMinor ? 0 : config.flatFeeMinor;
  const totalRawFee = percentageComponent + flatComponent;

  const finalFee = config.feeCapMinor > 0 ? Math.min(totalRawFee, config.feeCapMinor) : totalRawFee;
  return Math.max(0, finalFee);
}

/**
 * Pure, deterministic calculation of the complete financial chain using integer minor units (kobo).
 * Guaranteed invariants:
 * 1. grossAmountMinor === providerFeeMinor + platformFeeMinor + taxMinor + distributableAmountMinor
 * 2. sum(collaboratorAllocations.amountMinor) === distributableAmountMinor
 * 3. Odd remainder kobo assigned to member with highest percentage split (tie-breaker: first index)
 */
export function executeFinancialChain({
  grossAmountMinor,
  platformFeePercent = 0,
  authoritativeProviderFeeMinor,
  pricingConfig = DEFAULT_PAYSTACK_NGN_CONFIG,
  taxMinor = 0,
  collaborators,
  currency = 'NGN',
}: FinancialChainParams): DetailedFinancialChain {
  const gross = Math.max(0, Math.round(Number(grossAmountMinor)));
  const tax = Math.max(0, Math.round(Number(taxMinor)));

  // Determine provider fee: use authoritative Paystack fee if provided, else compute via configurable engine
  const providerFee =
    authoritativeProviderFeeMinor !== undefined && authoritativeProviderFeeMinor !== null
      ? Math.max(0, Math.round(Number(authoritativeProviderFeeMinor)))
      : calculatePaystackProviderFee(gross, pricingConfig);

  // Platform fee calculation (e.g. 5% of gross)
  const platformFee = Math.max(0, Math.round(gross * (platformFeePercent / 100)));

  // Net distributable pool funds
  const distributable = Math.max(0, gross - providerFee - platformFee - tax);

  const allocations: MemberAllocationMinor[] = [];

  if (collaborators.length > 0 && distributable > 0) {
    let allocatedSum = 0;
    let highestPctIndex = 0;
    let highestPct = -1;

    // Calculate baseline integer shares
    for (let i = 0; i < collaborators.length; i++) {
      const c = collaborators[i];
      const pct = Number(c.splitPercentage) || 0;

      if (pct > highestPct) {
        highestPct = pct;
        highestPctIndex = i;
      }

      const shareMinor = Math.floor((distributable * pct) / 100);
      allocatedSum += shareMinor;

      allocations.push({
        collaboratorId: c.id,
        userId: c.userId,
        role: c.role,
        splitPercentage: pct,
        amountMinor: shareMinor,
        amount: shareMinor / 100,
      });
    }

    // Remainder assignment to highest percentage shareholder (strictly preserves invariants)
    const remainder = distributable - allocatedSum;
    if (remainder !== 0 && allocations.length > 0) {
      allocations[highestPctIndex].amountMinor += remainder;
      allocations[highestPctIndex].amount = allocations[highestPctIndex].amountMinor / 100;
    }
  } else {
    // If 0 distributable or 0 collaborators, create zero allocations
    for (const c of collaborators) {
      allocations.push({
        collaboratorId: c.id,
        userId: c.userId,
        role: c.role,
        splitPercentage: Number(c.splitPercentage) || 0,
        amountMinor: 0,
        amount: 0,
      });
    }
  }

  return {
    grossAmountMinor: gross,
    grossAmount: gross / 100,
    providerFeeMinor: providerFee,
    providerFee: providerFee / 100,
    platformFeeMinor: platformFee,
    platformFee: platformFee / 100,
    platformFeePercent,
    taxMinor: tax,
    tax: tax / 100,
    distributableAmountMinor: distributable,
    distributableAmount: distributable / 100,
    currency,
    collaboratorAllocations: allocations,
  };
}

/**
 * Calculates member available balance based on ledger invariant:
 * available = allocated - withdrawn - pendingWithdrawal
 */
export function calculateMemberAvailableBalanceMinor(
  allocatedMinor: number | bigint,
  withdrawnMinor: number | bigint,
  pendingWithdrawalMinor: number | bigint = 0,
): number {
  const alloc = Math.max(0, Number(allocatedMinor));
  const withdr = Math.max(0, Number(withdrawnMinor));
  const pend = Math.max(0, Number(pendingWithdrawalMinor));

  return Math.max(0, alloc - withdr - pend);
}

/**
 * Calculates Paystack payout / transfer costs and government stamp duty for Nigerian bank accounts.
 * Paystack standard transfer pricing:
 * - ₦5,000 and below: ₦10 (1,000 kobo)
 * - ₦5,001 to ₦50,000: ₦25 (2,500 kobo)
 * - Above ₦50,000: ₦50 (5,000 kobo)
 *
 * Stamp Duty (Government Levy):
 * - ₦50 (5,000 kobo) for qualifying transfers of ₦10,000 or more
 */
export function calculatePaystackTransferCost(
  amountMinor: number | bigint,
  currency = 'NGN',
): {
  transferFeeMinor: number;
  stampDutyMinor: number;
  totalCostMinor: number;
} {
  const amt = Number(amountMinor);
  if (currency.toUpperCase() !== 'NGN' || amt <= 0) {
    return { transferFeeMinor: 0, stampDutyMinor: 0, totalCostMinor: 0 };
  }

  // Paystack transfer fee tiers:
  let transferFeeMinor = 1000; // ₦10 default (<= ₦5,000 = 500,000 kobo)
  if (amt > 5000000) {
    // > ₦50,000
    transferFeeMinor = 5000; // ₦50
  } else if (amt > 500000) {
    // ₦5,001 to ₦50,000
    transferFeeMinor = 2500; // ₦25
  }

  // Stamp duty: ₦50 on transfers >= ₦10,000 (1,000,000 kobo)
  const stampDutyMinor = amt >= 1000000 ? 5000 : 0;

  return {
    transferFeeMinor,
    stampDutyMinor,
    totalCostMinor: transferFeeMinor + stampDutyMinor,
  };
}

/**
 * Utility abstraction that safely extracts or converts minor units (kobo/cents).
 * Encapsulates the fallback logic between integer minor representations and legacy decimal major units.
 */
export function toMinorUnits(
  minor?: bigint | number | null,
  major?: { toString: () => string } | number | null,
): number {
  if (minor !== undefined && minor !== null) {
    return Number(minor);
  }
  if (major !== undefined && major !== null) {
    return Math.round(Number(major) * 100);
  }
  return 0;
}


