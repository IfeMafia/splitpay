import { Router } from 'express';
import * as authController from './controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { registerSchema, loginSchema, googleAuthSchema } from './validators';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/google', validateBody(googleAuthSchema), authController.googleAuth);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
