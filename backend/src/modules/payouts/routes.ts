import { Router } from 'express';
import * as payoutController from './controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const triggerPayoutSchema = z.object({
  paymentId: z.string().uuid(),
});

const withdrawSchema = z.object({
  collaboratorId: z.string().uuid(),
  amount: z.number().positive(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  bankCode: z.string().optional(),
});

router.use(authenticate);

router.post('/withdraw', validateBody(withdrawSchema), payoutController.requestWithdrawal);
router.post('/trigger', validateBody(triggerPayoutSchema), payoutController.triggerPayouts);
router.get('/payment/:paymentId', payoutController.getPaymentPayouts);
router.post('/:id/retry', payoutController.retryPayout);

export default router;

