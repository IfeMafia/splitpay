import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculatePaystackProviderFee,
  executeFinancialChain,
  calculateMemberAvailableBalanceMinor,
  calculatePaystackTransferCost,
  DEFAULT_PAYSTACK_NGN_CONFIG,
} from '../src/modules/splits/feeEngine';

describe('SplitPay Financial Engine — Core Arithmetic & Invariants', () => {
  describe('1. Paystack Provider Fee Calculations', () => {
    it('should waive flat ₦100 fee for transactions below ₦2,500 (e.g. ₦2,000)', () => {
      // ₦2,000 = 200,000 kobo
      // 1.5% of 200,000 = 3,000 kobo (₦30.00)
      const feeMinor = calculatePaystackProviderFee(200000);
      assert.strictEqual(feeMinor, 3000);
    });

    it('should apply 1.5% + ₦100 for transactions at ₦2,500 threshold', () => {
      // ₦2,500 = 250,000 kobo
      // 1.5% of 250,000 = 3,750 kobo (₦37.50) + 10,000 kobo (₦100) = 13,750 kobo (₦137.50)
      const feeMinor = calculatePaystackProviderFee(250000);
      assert.strictEqual(feeMinor, 13750);
    });

    it('should calculate ₦10,000 transaction fee correctly', () => {
      // ₦10,000 = 1,000,000 kobo
      // 1.5% of 1,000,000 = 15,000 kobo (₦150) + 10,000 kobo (₦100) = 25,000 kobo (₦250)
      const feeMinor = calculatePaystackProviderFee(1000000);
      assert.strictEqual(feeMinor, 25000);
    });

    it('should calculate ₦100,000 transaction fee correctly', () => {
      // ₦100,000 = 10,000,000 kobo
      // 1.5% of 10,000,000 = 150,000 kobo (₦1,500) + 10,000 kobo (₦100) = 160,000 kobo (₦1,600)
      const feeMinor = calculatePaystackProviderFee(10000000);
      assert.strictEqual(feeMinor, 160000);
    });

    it('should cap fee at ₦2,000 for ₦1,000,000 payment', () => {
      // ₦1,000,000 = 100,000,000 kobo
      // 1.5% = 1,500,000 kobo + 10,000 kobo = 1,510,000 kobo -> capped at 200,000 kobo (₦2,000)
      const feeMinor = calculatePaystackProviderFee(100000000);
      assert.strictEqual(feeMinor, 200000);
    });

    it('should cap fee at ₦2,000 when percentage + flat fee reaches cap threshold (e.g. ₦130,000)', () => {
      // ₦130,000 = 13,000,000 kobo
      // 1.5% = 195,000 kobo + 10,000 kobo = 205,000 kobo -> capped at 200,000 kobo (₦2,000)
      const feeMinor = calculatePaystackProviderFee(13000000);
      assert.strictEqual(feeMinor, 200000);
    });
  });

  describe('2. Complete Financial Chain Execution', () => {
    it('should execute ₦100,000 payment with 5% platform fee and Alice (60%) / Bob (40%)', () => {
      const result = executeFinancialChain({
        grossAmountMinor: 10000000, // ₦100,000
        platformFeePercent: 5,
        collaborators: [
          { id: 'c-alice', userId: 'u-alice', role: 'MEMBER', splitPercentage: 60 },
          { id: 'c-bob', userId: 'u-bob', role: 'MEMBER', splitPercentage: 40 },
        ],
      });

      // Assertions
      assert.strictEqual(result.grossAmountMinor, 10000000); // ₦100,000
      assert.strictEqual(result.grossAmount, 100000);
      assert.strictEqual(result.providerFeeMinor, 160000); // ₦1,600
      assert.strictEqual(result.providerFee, 1600);
      assert.strictEqual(result.platformFeeMinor, 500000); // ₦5,000
      assert.strictEqual(result.platformFee, 5000);
      assert.strictEqual(result.taxMinor, 0);
      assert.strictEqual(result.distributableAmountMinor, 9340000); // ₦93,400
      assert.strictEqual(result.distributableAmount, 93400);

      // Allocations
      assert.strictEqual(result.collaboratorAllocations.length, 2);
      const alice = result.collaboratorAllocations.find((a) => a.collaboratorId === 'c-alice')!;
      const bob = result.collaboratorAllocations.find((a) => a.collaboratorId === 'c-bob')!;

      assert.strictEqual(alice.amountMinor, 5604000); // ₦56,040
      assert.strictEqual(alice.amount, 56040);
      assert.strictEqual(bob.amountMinor, 3736000); // ₦37,360
      assert.strictEqual(bob.amount, 37360);

      // Accounting Invariant Checks
      assert.strictEqual(
        result.grossAmountMinor,
        result.providerFeeMinor + result.platformFeeMinor + result.taxMinor + result.distributableAmountMinor,
      );
      assert.strictEqual(
        result.distributableAmountMinor,
        alice.amountMinor + bob.amountMinor,
      );
    });

    it('should respect authoritative provider fee from Paystack if provided', () => {
      const result = executeFinancialChain({
        grossAmountMinor: 10000000,
        platformFeePercent: 5,
        authoritativeProviderFeeMinor: 155000, // Custom negotiated/provider fee of ₦1,550
        collaborators: [
          { id: 'c1', userId: 'u1', role: 'OWNER', splitPercentage: 100 },
        ],
      });

      assert.strictEqual(result.providerFeeMinor, 155000);
      assert.strictEqual(result.platformFeeMinor, 500000);
      assert.strictEqual(result.distributableAmountMinor, 10000000 - 155000 - 500000);
    });

    it('should handle single collaborator (100%)', () => {
      const result = executeFinancialChain({
        grossAmountMinor: 5000000, // ₦50,000
        platformFeePercent: 10,
        collaborators: [
          { id: 'c-sole', userId: 'u-sole', role: 'OWNER', splitPercentage: 100 },
        ],
      });

      // Provider fee: 1.5% of 50k (₦750) + ₦100 = ₦850 (85,000 kobo)
      // Platform fee: 10% of 50k = ₦5,000 (500,000 kobo)
      // Distributable = 50,000 - 850 - 5,000 = ₦44,150 (4,415,000 kobo)
      assert.strictEqual(result.providerFeeMinor, 85000);
      assert.strictEqual(result.platformFeeMinor, 500000);
      assert.strictEqual(result.distributableAmountMinor, 4415000);
      assert.strictEqual(result.collaboratorAllocations[0].amountMinor, 4415000);
    });

    it('should distribute remainder kobo to highest percentage shareholder deterministically', () => {
      // ₦100 gross, 0% platform fee, 0 provider fee -> 10,000 kobo distributable
      // 3 members: 50%, 25%, 25% -> 5,000, 2,500, 2,500
      // If distributable is 10,001 kobo:
      // 50% = 5,000.5 -> floor(5000.5) = 5000
      // 25% = 2,500.25 -> floor(2500.25) = 2500
      // 25% = 2,500.25 -> floor(2500.25) = 2500
      // Sum = 10,000. Remainder = 1 kobo.
      // Remainder must be assigned to member with 50% (highest percentage)
      const result = executeFinancialChain({
        grossAmountMinor: 10001,
        platformFeePercent: 0,
        authoritativeProviderFeeMinor: 0,
        collaborators: [
          { id: 'c1', userId: 'u1', role: 'MEMBER', splitPercentage: 50 },
          { id: 'c2', userId: 'u2', role: 'MEMBER', splitPercentage: 25 },
          { id: 'c3', userId: 'u3', role: 'MEMBER', splitPercentage: 25 },
        ],
      });

      assert.strictEqual(result.distributableAmountMinor, 10001);
      assert.strictEqual(result.collaboratorAllocations[0].amountMinor, 5001);
      assert.strictEqual(result.collaboratorAllocations[1].amountMinor, 2500);
      assert.strictEqual(result.collaboratorAllocations[2].amountMinor, 2500);

      const totalAllocated = result.collaboratorAllocations.reduce((sum, a) => sum + a.amountMinor, 0);
      assert.strictEqual(totalAllocated, 10001);
    });

    it('should resolve equal percentage tie deterministically (first highest index)', () => {
      // 3 members with equal 33.333% (represented as 33.33, 33.33, 33.34)
      const result = executeFinancialChain({
        grossAmountMinor: 10000, // 10,000 kobo (₦100)
        platformFeePercent: 0,
        authoritativeProviderFeeMinor: 0,
        collaborators: [
          { id: 'c1', userId: 'u1', role: 'MEMBER', splitPercentage: 33.34 },
          { id: 'c2', userId: 'u2', role: 'MEMBER', splitPercentage: 33.33 },
          { id: 'c3', userId: 'u3', role: 'MEMBER', splitPercentage: 33.33 },
        ],
      });

      const totalAllocated = result.collaboratorAllocations.reduce((sum, a) => sum + a.amountMinor, 0);
      assert.strictEqual(totalAllocated, 10000);
      assert.strictEqual(result.collaboratorAllocations[0].amountMinor, 3334);
      assert.strictEqual(result.collaboratorAllocations[1].amountMinor, 3333);
      assert.strictEqual(result.collaboratorAllocations[2].amountMinor, 3333);
    });
  });

  describe('3. Member Available Balances & Accounting Invariants', () => {
    it('should calculate member available balance correctly (allocated - withdrawn - pending)', () => {
      const allocatedMinor = 5604000; // ₦56,040
      const withdrawnMinor = 2000000; // ₦20,000
      const pendingWithdrawalMinor = 500000; // ₦5,000

      const available = calculateMemberAvailableBalanceMinor(
        allocatedMinor,
        withdrawnMinor,
        pendingWithdrawalMinor,
      );

      assert.strictEqual(available, 3104000); // ₦31,040
    });

    it('should return 0 available balance if withdrawn exceeds allocated', () => {
      const available = calculateMemberAvailableBalanceMinor(1000, 2000, 0);
      assert.strictEqual(available, 0);
    });
  });

  describe('4. Withdrawal Transfer Costs & Stamp Duty (Paystack NGN)', () => {
    it('should calculate transfer fee for <= ₦5,000 (₦10 fee, ₦0 stamp duty)', () => {
      // ₦4,000 = 400,000 kobo
      const cost = calculatePaystackTransferCost(400000);
      assert.strictEqual(cost.transferFeeMinor, 1000); // ₦10
      assert.strictEqual(cost.stampDutyMinor, 0); // ₦0
      assert.strictEqual(cost.totalCostMinor, 1000);
    });

    it('should calculate transfer fee & stamp duty for ₦20,000 (₦25 fee, ₦50 stamp duty)', () => {
      // ₦20,000 = 2,000,000 kobo (in ₦5,001 - ₦50,000 tier and >= ₦10,000)
      const cost = calculatePaystackTransferCost(2000000);
      assert.strictEqual(cost.transferFeeMinor, 2500); // ₦25
      assert.strictEqual(cost.stampDutyMinor, 5000); // ₦50
      assert.strictEqual(cost.totalCostMinor, 7500); // ₦75
    });

    it('should calculate transfer fee & stamp duty for > ₦50,000 (₦50 fee, ₦50 stamp duty)', () => {
      // ₦100,000 = 10,000,000 kobo
      const cost = calculatePaystackTransferCost(10000000);
      assert.strictEqual(cost.transferFeeMinor, 5000); // ₦50
      assert.strictEqual(cost.stampDutyMinor, 5000); // ₦50
      assert.strictEqual(cost.totalCostMinor, 10000); // ₦100
    });
  });
});
