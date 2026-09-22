import { Router } from 'express';
import * as userController from './controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  defaultCurrency: z.string().length(3),
  country: z.string().length(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  defaultCurrency: z.string().length(3).optional(),
});

router.post('/register', validateBody(registerSchema), userController.register);
router.post('/login', validateBody(loginSchema), userController.login);
router.get('/me', authenticate, userController.getProfile);
router.patch('/me', authenticate, validateBody(updateProfileSchema), userController.updateProfile);

export default router;
