import { Router } from 'express';
import * as paymentController from './controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const createPaymentSchema = z.object({
  projectId: z.string().uuid(),
  expectedAmount: z.number().positive(),
  currency: z.string().length(3),
  provider: z.string().min(1),
});

// Public checkout route
router.get('/link/:token', paymentController.getPaymentByToken);

// Protected routes
router.use(authenticate);
router.post('/link', validateBody(createPaymentSchema), paymentController.createPaymentLink);
router.get('/project/:projectId', paymentController.getProjectPayments);

export default router;
