"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const poolController = __importStar(require("./controller"));
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const validators_1 = require("./validators");
const routes_1 = __importDefault(require("../splits/routes"));
const routes_2 = __importDefault(require("../withdrawals/routes"));
const routes_3 = __importDefault(require("../transactions/routes"));
const router = (0, express_1.Router)();
// Pool collection routes
router.get('/', auth_1.authenticate, poolController.getPools);
router.post('/', auth_1.authenticate, (0, validate_1.validateBody)(validators_1.createPoolSchema), poolController.createPool);
// Specific pool routes
router.get('/:poolId', auth_1.authenticate, auth_1.requirePoolMember, poolController.getPool);
router.patch('/:poolId', auth_1.authenticate, auth_1.requirePoolOwner, (0, validate_1.validateBody)(validators_1.updatePoolSchema), poolController.updatePool);
router.delete('/:poolId', auth_1.authenticate, auth_1.requirePoolOwner, poolController.deletePool);
// Pool members routes
router.get('/:poolId/members', auth_1.authenticate, auth_1.requirePoolMember, poolController.getMembers);
router.post('/:poolId/members', auth_1.authenticate, auth_1.requirePoolOwner, (0, validate_1.validateBody)(validators_1.addMemberSchema), poolController.addMember);
router.delete('/:poolId/members/:memberId', auth_1.authenticate, auth_1.requirePoolOwner, poolController.removeMember);
// Transactions
router.use('/:poolId/transactions', routes_3.default);
// Split configuration, allocations, and balance — handled by splits module
router.use('/:poolId', routes_1.default);
// Withdrawals
router.use('/:poolId/withdrawals', routes_2.default);
exports.default = router;
//# sourceMappingURL=routes.js.map