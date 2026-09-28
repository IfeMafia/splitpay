"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
// Endpoint for Paystack webhooks: POST /api/webhooks/paystack
router.post('/paystack', (req, res, next) => {
    req.params.provider = 'paystack';
    (0, controller_1.handleProviderWebhook)(req, res, next);
});
// Dynamic provider webhook: POST /api/webhooks/:provider
router.post('/:provider', controller_1.handleProviderWebhook);
exports.default = router;
//# sourceMappingURL=routes.js.map