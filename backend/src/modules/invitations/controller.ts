import { Request, Response, NextFunction } from 'express';
import * as invitationService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function getInvitation(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.params.token as string;
    const invitation = await invitationService.getInvitation(token);
    res.status(200).json({ data: invitation });
  } catch (err) {
    next(err);
  }
}

export async function acceptInvitation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.params.token as string;
    const userId = req.user!.id;
    const result = await invitationService.acceptInvitation(token, userId);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}
