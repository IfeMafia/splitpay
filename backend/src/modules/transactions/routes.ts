import { Router } from 'express';
import * as transactionController from './controller';
import { authenticate, requirePoolMember } from '../../middleware/auth';

const router = Router({ mergeParams: true });

router.get(
  '/',
  authenticate,
  requirePoolMember,
  transactionController.getTransactions,
);

export default router;
