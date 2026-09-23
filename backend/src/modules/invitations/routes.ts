import { Router } from 'express';
import * as invitationController from './controller';
import { authenticate, requirePoolMember, requirePoolOwner } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createCodeInviteSchema, createEmailInviteSchema } from './validators';

export const poolInvitationRouter = Router({ mergeParams: true });

poolInvitationRouter.post(
  '/code',
  authenticate,
  requirePoolOwner,
  validateBody(createCodeInviteSchema),
  invitationController.createCodeInvitation,
);

poolInvitationRouter.post(
  '/email',
  authenticate,
  requirePoolOwner,
  validateBody(createEmailInviteSchema),
  invitationController.createEmailInvitation,
);

poolInvitationRouter.get(
  '/',
  authenticate,
  requirePoolMember,
  invitationController.getPoolInvitations,
);

poolInvitationRouter.delete(
  '/:invitationId',
  authenticate,
  requirePoolOwner,
  invitationController.revokeInvitation,
);

export const publicInvitationRouter = Router();

publicInvitationRouter.get(
  '/:token',
  invitationController.getInvitationPreview,
);

publicInvitationRouter.post(
  '/:token/accept',
  authenticate,
  invitationController.acceptInvitation,
);
