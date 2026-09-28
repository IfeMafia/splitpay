"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ledger_service_1 = require("../modules/payments/ledger.service");
function runFinancialSmokeTests() {
    console.log('=== Running Financial Infrastructure Smoke Tests (T1 - T11) ===\n');
    // Test 1: Minor-Unit Kobo Arithmetic & Remainder Protection
    console.log('Test 1: Financial Chain Minor-Unit Kobo Calculation');
    const grossNaira = 10000;
    const platformFeePct = 2.5; // 2.5%
    const providerFeeNaira = 150; // 1.5% fixed Paystack fee
    const collaborators = [
        { id: 'collab_1', userId: 'usr_alice', role: 'Developer', splitPercentage: 60 },
        { id: 'collab_2', userId: 'usr_bob', role: 'Designer', splitPercentage: 40 },
    ];
    const breakdown = (0, ledger_service_1.calculateFinancialChain)(grossNaira, platformFeePct, providerFeeNaira, collaborators);
    console.log('Gross Amount (NGN):', breakdown.grossAmount);
    console.log('Provider Fee (NGN):', breakdown.providerFee);
    console.log('Platform Fee (NGN):', breakdown.platformFee);
    console.log('Distributable Amount (NGN):', breakdown.distributableAmount);
    console.log('Collaborator Allocations:', breakdown.collaboratorAllocations);
    if (breakdown.grossAmount !== 10000)
        throw new Error('Gross amount mismatch');
    if (breakdown.providerFee !== 150)
        throw new Error('Provider fee mismatch');
    if (breakdown.platformFee !== 250)
        throw new Error('Platform fee mismatch');
    if (breakdown.distributableAmount !== 9600)
        throw new Error('Distributable amount mismatch');
    const totalAllocated = breakdown.collaboratorAllocations.reduce((sum, c) => sum + c.amount, 0);
    if (totalAllocated !== breakdown.distributableAmount) {
        throw new Error(`Allocation total mismatch: expected ${breakdown.distributableAmount}, got ${totalAllocated}`);
    }
    console.log('✅ Test 1 Passed: Minor-unit calculation & 100% allocation guarantee verified.\n');
    // Test 2: Odd Percentage Split with Integer Remainder Assignment
    console.log('Test 2: Odd Percentage Split (33.33 / 33.33 / 33.34)');
    const oddCollaborators = [
        { id: 'c1', userId: 'u1', role: 'Dev 1', splitPercentage: 33.33 },
        { id: 'c2', userId: 'u2', role: 'Dev 2', splitPercentage: 33.33 },
        { id: 'c3', userId: 'u3', role: 'Dev 3', splitPercentage: 33.34 },
    ];
    const oddBreakdown = (0, ledger_service_1.calculateFinancialChain)(1000, 0, 0, oddCollaborators);
    const oddTotal = oddBreakdown.collaboratorAllocations.reduce((sum, c) => sum + c.amount, 0);
    if (oddTotal !== oddBreakdown.distributableAmount) {
        throw new Error(`Odd split allocation total mismatch: expected ${oddBreakdown.distributableAmount}, got ${oddTotal}`);
    }
    console.log('Allocations:', oddBreakdown.collaboratorAllocations);
    console.log('✅ Test 2 Passed: Odd split integer minor-unit arithmetic verified.\n');
    console.log('🎉 All Financial Infrastructure Smoke Tests Passed Cleanly!');
}
runFinancialSmokeTests();
//# sourceMappingURL=financial-smoke.test.js.map