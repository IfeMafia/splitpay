import { Response, NextFunction } from 'express';
import * as invitationService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function createCodeInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const invite = await invitationService.createCodeInvitation(req.params.poolId as string, req.user!.id, req.body);
    res.status(201).json({
      data: invite,
      message: 'Invite code generated successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function createEmailInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const invite = await invitationService.createEmailInvitation(req.params.poolId as string, req.user!.id, req.body);
    res.status(201).json({
      data: invite,
      message: 'Invitation email dispatched successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getPoolInvitations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const invites = await invitationService.getPoolInvitations(req.params.poolId as string);
    res.status(200).json({ data: invites });
  } catch (err) {
    next(err);
  }
}

export async function revokeInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await invitationService.revokeInvitation(req.params.poolId as string, req.params.invitationId as string);
    res.status(200).json({
      message: 'Invitation revoked successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getInvitationPreview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const invite = await invitationService.getInvitationByToken(req.params.token as string);
    res.status(200).json({ data: invite });
  } catch (err) {
    next(err);
  }
}

export async function acceptInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const member = await invitationService.acceptInvitation(req.params.token as string, req.user!.id);
    res.status(200).json({
      data: member,
      message: 'Invitation accepted and joined pool',
    });
  } catch (err) {
    next(err);
  }
}
