import { Router } from 'express';
import { handleProviderWebhook } from './controller';

const router = Router();

// Endpoint for Paystack webhooks: POST /api/webhooks/paystack
router.post('/paystack', (req, res, next) => {
  (req.params as Record<string, string>).provider = 'paystack';
  handleProviderWebhook(req, res, next);
});

// Dynamic provider webhook: POST /api/webhooks/:provider
router.post('/:provider', handleProviderWebhook);

export default router;
