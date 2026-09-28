"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const splitEngine_1 = require("../modules/splits/splitEngine");
const ledger_service_1 = require("../modules/payments/ledger.service");
const client_1 = require("@prisma/client");
function runValidationTests() {
    console.log('=== Running Financial Validation Tests (T6, T7, T11) ===\n');
    // Test 1: Processing Fee Capping
    console.log('Test 1: Fee Capping at NGN 2,000');
    const feeSmall = (0, splitEngine_1.calculateProcessingFee)(10000); // 1.5% of 10000 = 150
    if (feeSmall !== 150)
        throw new Error(`Expected fee 150, got ${feeSmall}`);
    const feeLarge = (0, splitEngine_1.calculateProcessingFee)(500000); // 1.5% of 500000 = 7500 => capped at 2000
    if (feeLarge !== 2000)
        throw new Error(`Expected capped fee 2000, got ${feeLarge}`);
    console.log('✅ Test 1 Passed: Processing fee properly calculated & capped.\n');
    // Test 2: Equal Split with Remainder
    console.log('Test 2: Equal Split with Remainder Distribution');
    const resultEqual = (0, splitEngine_1.calculateAllocations)({
        totalAmountMajor: 100,
        splitType: client_1.SplitType.EQUAL,
        members: [{ memberId: 'm1' }, { memberId: 'm2' }, { memberId: 'm3' }],
        feeAmountMajor: 0,
    });
    const sumEqualMinor = resultEqual.allocations.reduce((sum, a) => sum + a.amountMinor, 0);
    if (sumEqualMinor !== 10000) {
        throw new Error(`Equal split sum mismatch: expected 10000 minor, got ${sumEqualMinor}`);
    }
    if (resultEqual.allocations[0].amountMinor !== 3334) {
        throw new Error(`Expected first member to get remainder kobo 3334, got ${resultEqual.allocations[0].amountMinor}`);
    }
    console.log('✅ Test 2 Passed: Equal split remainder allocated without kobo loss.\n');
    // Test 3: Custom Split Percentage Validation
    console.log('Test 3: Custom Split Validation');
    let invalidThrown = false;
    try {
        (0, splitEngine_1.calculateAllocations)({
            totalAmountMajor: 100,
            splitType: client_1.SplitType.CUSTOM,
            members: [
                { memberId: 'm1', percentage: 50 },
                { memberId: 'm2', percentage: 40 },
            ],
        });
    }
    catch (err) {
        invalidThrown = true;
    }
    if (!invalidThrown)
        throw new Error('Expected custom split non-100% to throw an error');
    console.log('✅ Test 3 Passed: Custom split total percentage enforcement verified.\n');
    // Test 4: Financial Chain Complete Ledger Calculation
    console.log('Test 4: Financial Chain Full Ledger Calculation');
    const chainResult = (0, ledger_service_1.calculateFinancialChain)(50000, 2, 750, [
        { id: 'm1', userId: 'u1', role: 'Lead', splitPercentage: 70 },
        { id: 'm2', userId: 'u2', role: 'Member', splitPercentage: 30 },
    ]);
    if (chainResult.grossAmount !== 50000)
        throw new Error('Gross mismatch');
    if (chainResult.providerFee !== 750)
        throw new Error('Provider fee mismatch');
    if (chainResult.platformFee !== 1000)
        throw new Error('Platform fee mismatch (2% of 50000)');
    if (chainResult.distributableAmount !== 48250)
        throw new Error('Distributable amount mismatch');
    const totalCollabAllocations = chainResult.collaboratorAllocations.reduce((s, a) => s + a.amount, 0);
    if (totalCollabAllocations !== 48250) {
        throw new Error(`Allocation sum mismatch: expected 48250, got ${totalCollabAllocations}`);
    }
    console.log('✅ Test 4 Passed: Financial chain calculation verified.\n');
    console.log('🎉 All Financial Validation Tests Passed Successfully!');
}
runValidationTests();
//# sourceMappingURL=financial-validation.test.js.map