import { Router } from 'express';
import * as collaboratorController from './controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const addCollaboratorSchema = z.object({
  projectId: z.string().uuid(),
  invitedEmail: z.string().email().optional(),
  userId: z.string().uuid().optional(),
  role: z.string().min(1),
  splitPercentage: z.number().min(0.01).max(100),
});

const updateCollaboratorSchema = z.object({
  role: z.string().optional(),
  splitPercentage: z.number().min(0.01).max(100).optional(),
  status: z.enum(['INVITED', 'CONFIRMED', 'REMOVED']).optional(),
  payoutAccountId: z.string().uuid().optional(),
});

router.use(authenticate);

router.post('/', validateBody(addCollaboratorSchema), collaboratorController.addCollaborator);
router.get('/project/:projectId', collaboratorController.getCollaborators);
router.patch('/:id', validateBody(updateCollaboratorSchema), collaboratorController.updateCollaborator);
router.delete('/:id', collaboratorController.removeCollaborator);

export default router;
