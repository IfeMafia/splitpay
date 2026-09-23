import { Response, NextFunction } from 'express';
import * as authService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      data: result,
      message: 'Account registered successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({
      data: result,
      message: 'Logged in successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // In stateless JWT auth, client clears token from storage
    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    res.status(200).json({
      data: user,
    });
  } catch (err) {
    next(err);
  }
}
