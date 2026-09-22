import { Router } from 'express';
import * as payoutAccountController from './controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const createAccountSchema = z.object({
  provider: z.string().min(1),
  providerAccountRef: z.string().min(1),
  country: z.string().length(2),
  currency: z.string().length(3),
  isDefault: z.boolean().optional(),
});

router.use(authenticate);

router.post('/', validateBody(createAccountSchema), payoutAccountController.createAccount);
router.get('/', payoutAccountController.getAccounts);
router.delete('/:id', payoutAccountController.deleteAccount);

export default router;
