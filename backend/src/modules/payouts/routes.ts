import { Router } from 'express';
import * as payoutController from './controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const triggerPayoutSchema = z.object({
  paymentId: z.string().uuid(),
});

router.use(authenticate);

router.post('/trigger', validateBody(triggerPayoutSchema), payoutController.triggerPayouts);
router.get('/payment/:paymentId', payoutController.getPaymentPayouts);
router.post('/:id/retry', payoutController.retryPayout);

export default router;
