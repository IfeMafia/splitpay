import { Request, Response, NextFunction } from 'express';
import * as userService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await userService.loginUser(req.body.email, req.body.password);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const user = await userService.getUserById(userId);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const user = await userService.updateUser(userId, req.body);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}
