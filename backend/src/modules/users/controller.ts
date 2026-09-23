import { Response, NextFunction } from 'express';
import * as userService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await userService.getUserProfile(req.user!.id);
    res.status(200).json({ data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await userService.updateUserProfile(req.user!.id, req.body);
    res.status(200).json({
      data: profile,
      message: 'Profile updated successfully',
    });
  } catch (err) {
    next(err);
  }
}
