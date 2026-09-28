"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routes_1 = __importDefault(require("../modules/auth/routes"));
const routes_2 = __importDefault(require("../modules/users/routes"));
const routes_3 = __importDefault(require("../modules/pools/routes"));
const routes_4 = __importDefault(require("../modules/collaborators/routes"));
const routes_5 = __importDefault(require("../modules/invitations/routes"));
const routes_6 = __importDefault(require("../modules/payments/routes"));
const routes_7 = __importDefault(require("../modules/notifications/routes"));
const routes_8 = __importDefault(require("../modules/webhooks/routes"));
const routes_9 = require("../modules/payment-links/routes");
const router = (0, express_1.Router)();
// Authentication
router.use('/auth', routes_1.default);
// Users
router.use('/users', routes_2.default);
// Pools (includes splits, balance, allocations, withdrawals, transactions)
router.use('/pools', routes_3.default);
router.use('/projects', routes_3.default);
// Pool payment-links (authenticated, pool-scoped)
router.use('/pools/:poolId/payment-links', routes_9.poolPaymentLinkRouter);
// Public payment checkout (unauthenticated)
router.use('/pay', routes_9.publicPayRouter);
// Collaborators (invitations + members)
router.use('/collaborators', routes_4.default);
// Public invitation flow (view + accept by token)
router.use('/invitations', routes_5.default);
// Payments: Paystack verification, webhook, callback
router.use('/payments', routes_6.default);
// Notifications
router.use('/notifications', routes_7.default);
// Webhooks
router.use('/webhooks', routes_8.default);
exports.default = router;
//# sourceMappingURL=index.js.map