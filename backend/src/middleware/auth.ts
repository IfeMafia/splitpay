import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { prisma } from '../lib/prisma';
import { Pool, PoolMember, PoolRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  poolMember?: PoolMember;
  pool?: Pool;
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing or invalid Authorization header', 'UNAUTHORIZED'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    next(new AppError(401, 'Token is invalid or expired', 'UNAUTHORIZED'));
  }
}

export function optionalAuthenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
    req.user = { id: payload.id, email: payload.email };
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}

/**
 * Ensures the authenticated user belongs to the specified pool in req.params.poolId
 */
export function requirePoolMember(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
  }

  const poolId = req.params.poolId as string;
  if (!poolId) {
    return next(new AppError(400, 'poolId parameter is missing', 'BAD_REQUEST'));
  }

  prisma.poolMember.findUnique({
    where: {
      poolId_userId: {
        poolId,
        userId: req.user.id,
      },
    },
    include: {
      pool: true,
    },
  }).then((member) => {
    if (!member) {
      return next(new AppError(403, 'You are not a member of this Pool', 'FORBIDDEN'));
    }
    req.poolMember = member;
    req.pool = (member as unknown as { pool: Pool }).pool;
    next();
  }).catch(next);
}

/**
 * Ensures the authenticated user is an OWNER of the specified pool
 */
export function requirePoolOwner(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
  }

  const poolId = req.params.poolId as string;
  if (!poolId) {
    return next(new AppError(400, 'poolId parameter is missing', 'BAD_REQUEST'));
  }

  prisma.poolMember.findUnique({
    where: {
      poolId_userId: {
        poolId,
        userId: req.user.id,
      },
    },
    include: {
      pool: true,
    },
  }).then((member) => {
    if (!member || member.role !== PoolRole.OWNER) {
      return next(new AppError(403, 'Owner privileges required for this action', 'FORBIDDEN'));
    }
    req.poolMember = member;
    req.pool = (member as unknown as { pool: Pool }).pool;
    next();
  }).catch(next);
}
