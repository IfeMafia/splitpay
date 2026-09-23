import { Router } from 'express';
import * as withdrawalController from './controller';
import { authenticate, requirePoolMember } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { requestWithdrawalSchema } from './validators';

const router = Router({ mergeParams: true });

router.get(
  '/',
  authenticate,
  requirePoolMember,
  withdrawalController.getWithdrawals,
);

router.post(
  '/',
  authenticate,
  requirePoolMember,
  validateBody(requestWithdrawalSchema),
  withdrawalController.requestWithdrawal,
);

router.get(
  '/:withdrawalId',
  authenticate,
  requirePoolMember,
  withdrawalController.getWithdrawal,
);

export default router;
