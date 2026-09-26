import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code ?? 'ERROR',
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: `A resource with that ${target} already exists.`,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
        },
      });
      return;
    }

    if (err.code === 'P2003') {
      res.status(400).json({
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Referenced foreign record does not exist.',
        },
      });
      return;
    }
  }

  // Handle Prisma Client Initialization / Connection Errors (Bad credentials, DB offline, etc.)
  if (err instanceof Prisma.PrismaClientInitializationError) {
    res.status(500).json({
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Failed to connect to the database. Check DATABASE_URL credentials in .env.',
        details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
      },
    });
    return;
  }

  // JSON parsing error
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid JSON payload received.',
      },
    });
    return;
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV !== 'production' ? err.message : 'An unexpected error occurred.',
    },
  });
}
