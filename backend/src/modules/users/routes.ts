import { Router } from 'express';
import * as userController from './controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { updateProfileSchema } from './validators';

const router = Router();

router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, validateBody(updateProfileSchema), userController.updateMe);

export default router;
