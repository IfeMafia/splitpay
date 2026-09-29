import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateAllocations, calculateProcessingFee } from '../src/modules/splits/splitEngine';
import { SplitType } from '@prisma/client';

describe('Split Engine — Arithmetic & Allocations', () => {
  it('should calculate 1.5% fee correctly', () => {
    const fee = calculateProcessingFee(1000);
    assert.strictEqual(fee, 15);
  });

  it('should cap the fee at 2000', () => {
    const fee = calculateProcessingFee(500000);
    assert.strictEqual(fee, 2000);
  });

  it('should calculate equal split evenly without fee override', () => {
    const members = [
      { memberId: 'm1' },
      { memberId: 'm2' },
      { memberId: 'm3' },
      { memberId: 'm4' },
    ];

    // Total: 100, Fee: 0
    const result = calculateAllocations({
      totalAmountMajor: 100,
      feeAmountMajor: 0,
      splitType: SplitType.EQUAL,
      members,
    });

    assert.strictEqual(result.distributableAmount, 100);
    assert.strictEqual(result.allocations.length, 4);

    // Each member gets exactly 25.00
    for (const alloc of result.allocations) {
      assert.strictEqual(alloc.amount, 25.0);
      assert.strictEqual(alloc.amountMinor, 2500);
    }

    const sumAllocated = result.allocations.reduce((sum, a) => sum + a.amount, 0);
    assert.strictEqual(sumAllocated, 100);
  });

  it('should handle equal split with remainder deterministically (no lost kobo/cents)', () => {
    const members = [
      { memberId: 'm1' },
      { memberId: 'm2' },
      { memberId: 'm3' },
    ];

    // Total: 100 split 3 ways -> 33.34, 33.33, 33.33
    const result = calculateAllocations({
      totalAmountMajor: 100,
      feeAmountMajor: 0,
      splitType: SplitType.EQUAL,
      members,
    });

    assert.strictEqual(result.distributableAmount, 100);
    assert.strictEqual(result.allocations[0].amount, 33.34);
    assert.strictEqual(result.allocations[1].amount, 33.33);
    assert.strictEqual(result.allocations[2].amount, 33.33);

    const sumAllocatedMinor = result.allocations.reduce((sum, a) => sum + a.amountMinor, 0);
    assert.strictEqual(sumAllocatedMinor, 10000); // exactly 10,000 cents/kobo
  });

  it('should calculate custom percentage split correctly', () => {
    const members = [
      { memberId: 'm1', percentage: 70 },
      { memberId: 'm2', percentage: 20 },
      { memberId: 'm3', percentage: 10 },
    ];

    const result = calculateAllocations({
      totalAmountMajor: 500,
      feeAmountMajor: 50,
      platformFeePercent: 0,
      splitType: SplitType.CUSTOM,
      members,
    });

    // Distributable: 500 - 50 = 450
    assert.strictEqual(result.distributableAmount, 450);

    const a1 = result.allocations.find((a) => a.memberId === 'm1')!;
    const a2 = result.allocations.find((a) => a.memberId === 'm2')!;
    const a3 = result.allocations.find((a) => a.memberId === 'm3')!;

    assert.strictEqual(a1.amount, 315.0); // 70% of 450
    assert.strictEqual(a2.amount, 90.0); // 20% of 450
    assert.strictEqual(a3.amount, 45.0); // 10% of 450

    const totalAllocated = result.allocations.reduce((sum, a) => sum + a.amount, 0);
    assert.strictEqual(totalAllocated, 450);
  });

  it('should throw an error if custom split does not sum to 100%', () => {
    const members = [
      { memberId: 'm1', percentage: 60 },
      { memberId: 'm2', percentage: 30 },
    ];

    assert.throws(() => {
      calculateAllocations({
        totalAmountMajor: 100,
        feeAmountMajor: 0,
        splitType: SplitType.CUSTOM,
        members,
      });
    }, /Custom split percentages must sum to 100%/);
  });
});
