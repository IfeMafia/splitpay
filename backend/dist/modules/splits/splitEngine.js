"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProcessingFee = calculateProcessingFee;
exports.calculateAllocations = calculateAllocations;
const client_1 = require("@prisma/client");
/**
 * Calculates platform/processing fee.
 * Default: 1.5% capped at NGN 2,000 / $50 equivalent.
 */
function calculateProcessingFee(totalAmountMajor) {
    const percentageFee = totalAmountMajor * 0.015;
    const cappedFee = Math.min(percentageFee, 2000);
    // Round fee to 2 decimal places
    return Math.round(cappedFee * 100) / 100;
}
/**
 * Pure function to calculate deterministic split allocations.
 * Converts to integer minor units (kobo/cents) to prevent any floating point drift.
 */
function calculateAllocations({ totalAmountMajor, splitType, members, feeAmountMajor, }) {
    if (members.length === 0) {
        throw new Error('At least one member is required to calculate splits');
    }
    const fee = feeAmountMajor ?? calculateProcessingFee(totalAmountMajor);
    const distributableMajor = Math.max(0, totalAmountMajor - fee);
    const distributableMinor = Math.round(distributableMajor * 100);
    const allocations = [];
    if (splitType === client_1.SplitType.EQUAL) {
        const memberCount = members.length;
        const baseShareMinor = Math.floor(distributableMinor / memberCount);
        let remainderMinor = distributableMinor % memberCount;
        const equalPercentage = Math.round((100 / memberCount) * 100) / 100;
        for (let i = 0; i < memberCount; i++) {
            let memberShareMinor = baseShareMinor;
            if (remainderMinor > 0) {
                memberShareMinor += 1;
                remainderMinor -= 1;
            }
            allocations.push({
                memberId: members[i].memberId,
                percentage: equalPercentage,
                amountMinor: memberShareMinor,
                amount: Math.round(memberShareMinor) / 100,
            });
        }
    }
    else if (splitType === client_1.SplitType.CUSTOM) {
        // Validate percentages sum to exactly 100% (within 0.01 tolerance)
        const totalPercentage = members.reduce((sum, m) => sum + (m.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
            throw new Error(`Custom split percentages must sum to 100%. Current sum: ${totalPercentage}%`);
        }
        let allocatedSumMinor = 0;
        for (const m of members) {
            const pct = m.percentage || 0;
            // Calculate share in minor units
            const shareMinor = Math.round((distributableMinor * pct) / 100);
            allocatedSumMinor += shareMinor;
            allocations.push({
                memberId: m.memberId,
                percentage: pct,
                amountMinor: shareMinor,
                amount: Math.round(shareMinor) / 100,
            });
        }
        // Distribute any single minor unit rounding difference to the largest shareholder
        const difference = distributableMinor - allocatedSumMinor;
        if (difference !== 0 && allocations.length > 0) {
            // Find allocation with highest percentage
            let highestIndex = 0;
            for (let i = 1; i < allocations.length; i++) {
                if (allocations[i].percentage > allocations[highestIndex].percentage) {
                    highestIndex = i;
                }
            }
            allocations[highestIndex].amountMinor += difference;
            allocations[highestIndex].amount = Math.round(allocations[highestIndex].amountMinor) / 100;
        }
    }
    return {
        totalAmount: totalAmountMajor,
        feeAmount: fee,
        distributableAmount: distributableMajor,
        allocations,
    };
}
//# sourceMappingURL=splitEngine.js.map