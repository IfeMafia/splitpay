import { Router } from 'express';
import * as poolController from './controller';
import { authenticate, requirePoolMember, requirePoolOwner } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createPoolSchema, updatePoolSchema, addMemberSchema } from './validators';

const router = Router();

// Pool collection routes
router.get('/', authenticate, poolController.getPools);
router.post('/', authenticate, validateBody(createPoolSchema), poolController.createPool);

// Specific pool routes
router.get('/:poolId', authenticate, requirePoolMember, poolController.getPool);
router.patch('/:poolId', authenticate, requirePoolOwner, validateBody(updatePoolSchema), poolController.updatePool);
router.delete('/:poolId', authenticate, requirePoolOwner, poolController.deletePool);

// Pool members routes
router.get('/:poolId/members', authenticate, requirePoolMember, poolController.getMembers);
router.post('/:poolId/members', authenticate, requirePoolOwner, validateBody(addMemberSchema), poolController.addMember);
router.delete('/:poolId/members/:memberId', authenticate, requirePoolOwner, poolController.removeMember);

export default router;
