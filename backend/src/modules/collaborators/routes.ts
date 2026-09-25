import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as collaboratorController from './controller';

const router = Router();

// All collaborator routes require authentication
router.use(authenticate);

// Create an invitation / add a collaborator to a pool
router.post('/', collaboratorController.createCollaborator);

// List all collaborators (pending + confirmed) for a pool
router.get('/project/:projectId', collaboratorController.getProjectCollaborators);

// Revoke invitation or remove a pool member by id
router.delete('/:id', collaboratorController.removeCollaborator);

export default router;
