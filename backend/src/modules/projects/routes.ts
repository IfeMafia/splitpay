import { Router } from 'express';
import * as projectController from './controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  totalAmount: z.number().positive(),
  currency: z.string().length(3),
});

const updateProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  totalAmount: z.number().positive().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAID', 'DISTRIBUTING', 'COMPLETED', 'CANCELLED']).optional(),
});

router.use(authenticate);

router.post('/', validateBody(createProjectSchema), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.patch('/:id', validateBody(updateProjectSchema), projectController.updateProject);

export default router;
