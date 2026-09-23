import { Router } from 'express';
import * as invitationController from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public endpoint to view an invitation details
router.get('/:token', invitationController.getInvitation);

// Protected endpoint to accept it
router.post('/:token/accept', authenticate, invitationController.acceptInvitation);

export default router;
