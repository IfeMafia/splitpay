import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * TODO: Implement full JWT auth middleware:
 * - Extract Bearer token from Authorization header
 * - Verify token signature with JWT_SECRET
 * - Attach decoded user payload to req.user
 * - Reject with 401 if token is missing, expired, or invalid
 */
export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing or invalid Authorization header', 'UNAUTHORIZED'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, 'Token is invalid or expired', 'UNAUTHORIZED'));
  }
}

/**
 * TODO: Implement role-based access control:
 * - Accept a list of allowed roles
 * - Check req.user.role against the list
 * - Reject with 403 if the role is not permitted
 */
export function authorize(..._roles: string[]) {
  return (_req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    // TODO: check req.user.role against _roles
    next();
  };
}
