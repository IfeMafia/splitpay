import { Router } from 'express';
import * as webhookController from './controller';

const router = Router();

// Unprotected routes for payment gateway webhooks
router.post('/:provider', webhookController.handleProviderWebhook);

export default router;
