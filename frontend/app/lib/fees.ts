/**
 * SplitPay Fee Calculation Engine
 * Platform Fee: 1.01%
 * Payment Gateway (Paystack NGN): 1.5% + ₦100 (cap ₦2,000, flat fee waived under ₦2,500)
 */

export const PLATFORM_FEE_RATE = 0.0101; // 1.01%
export const PAYSTACK_RATE = 0.015;      // 1.5%
export const PAYSTACK_FLAT_FEE = 100;    // ₦100
export const PAYSTACK_FEE_CAP = 2000;    // ₦2,000 max cap
export const PAYSTACK_WAIVER_THRESHOLD = 2500; // ₦2,500

export interface FeeCalculationBreakdown {
  targetPoolAmount: number;
  grossClientAmount: number;
  platformFee: number;
  gatewayFee: number;
  totalFees: number;
  netDistributable: number;
}

/**
 * Calculates Paystack gateway processing fee on a given gross amount in Naira.
 */
export function calculatePaystackFee(grossAmount: number): number {
  if (grossAmount <= 0) return 0;
  const flatFee = grossAmount < PAYSTACK_WAIVER_THRESHOLD ? 0 : PAYSTACK_FLAT_FEE;
  const variableFee = grossAmount * PAYSTACK_RATE;
  const total = variableFee + flatFee;
  return Math.min(PAYSTACK_FEE_CAP, Math.round(total * 100) / 100);
}

/**
 * Calculates Gross-Up so the pool receives 100% of the target amount after both Paystack and SplitPay fees.
 * Client pays: Target + Paystack fee + SplitPay 1.01% fee.
 */
export function calculateGrossUpClientBearsFees(targetPoolAmount: number): FeeCalculationBreakdown {
  if (targetPoolAmount <= 0) {
    return {
      targetPoolAmount: 0,
      grossClientAmount: 0,
      platformFee: 0,
      gatewayFee: 0,
      totalFees: 0,
      netDistributable: 0,
    };
  }

  let gross = 0;

  // Case 1: Under waiver threshold (no flat fee)
  if (targetPoolAmount < PAYSTACK_WAIVER_THRESHOLD - 50) {
    const totalRate = PAYSTACK_RATE + PLATFORM_FEE_RATE;
    gross = targetPoolAmount / (1 - totalRate);
  } else {
    // Case 2: Check if Paystack fee will hit the ₦2,000 cap
    // Cap is hit when gross * 0.015 + 100 >= 2000 => gross >= ~126,666.67
    const grossIfCapped = (targetPoolAmount + PAYSTACK_FEE_CAP) / (1 - PLATFORM_FEE_RATE);
    if (grossIfCapped * PAYSTACK_RATE + PAYSTACK_FLAT_FEE >= PAYSTACK_FEE_CAP) {
      gross = grossIfCapped;
    } else {
      // Uncapped standard formula
      const totalRate = PAYSTACK_RATE + PLATFORM_FEE_RATE;
      gross = (targetPoolAmount + PAYSTACK_FLAT_FEE) / (1 - totalRate);
    }
  }

  const grossClientAmount = Math.ceil(gross * 100) / 100;
  const gatewayFee = calculatePaystackFee(grossClientAmount);
  const platformFee = Math.round(grossClientAmount * PLATFORM_FEE_RATE * 100) / 100;
  const totalFees = Math.round((gatewayFee + platformFee) * 100) / 100;
  const netDistributable = Math.round((grossClientAmount - totalFees) * 100) / 100;

  return {
    targetPoolAmount,
    grossClientAmount,
    platformFee,
    gatewayFee,
    totalFees,
    netDistributable,
  };
}

/**
 * Calculates fee deductions when the total client price is fixed (merchant absorbs fees).
 */
export function calculateDeductionsMerchantBearsFees(totalClientAmount: number): FeeCalculationBreakdown {
  if (totalClientAmount <= 0) {
    return {
      targetPoolAmount: 0,
      grossClientAmount: 0,
      platformFee: 0,
      gatewayFee: 0,
      totalFees: 0,
      netDistributable: 0,
    };
  }

  const gatewayFee = calculatePaystackFee(totalClientAmount);
  const platformFee = Math.round(totalClientAmount * PLATFORM_FEE_RATE * 100) / 100;
  const totalFees = Math.round((gatewayFee + platformFee) * 100) / 100;
  const netDistributable = Math.max(0, Math.round((totalClientAmount - totalFees) * 100) / 100);

  return {
    targetPoolAmount: netDistributable,
    grossClientAmount: totalClientAmount,
    platformFee,
    gatewayFee,
    totalFees,
    netDistributable,
  };
}
