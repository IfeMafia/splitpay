import { Router } from 'express';
import * as splitController from './controller';
import { authenticate, requirePoolMember, requirePoolOwner } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { configureSplitSchema } from './validators';

const router = Router({ mergeParams: true });

router.get(
  '/split',
  authenticate,
  requirePoolMember,
  splitController.getSplitConfig,
);

router.post(
  '/split',
  authenticate,
  requirePoolOwner,
  validateBody(configureSplitSchema),
  splitController.configureSplit,
);

router.get(
  '/allocations',
  authenticate,
  requirePoolMember,
  splitController.getAllocations,
);

router.get(
  '/balance',
  authenticate,
  requirePoolMember,
  splitController.getBalance,
);

export default router;
