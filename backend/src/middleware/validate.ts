import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validates req.body against the provided Zod schema.
 * Returns 422 with field-level errors on failure.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body validation failed.',
          fields: errors,
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Validates req.params against the provided Zod schema.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request params validation failed.',
          fields: errors,
        },
      });
      return;
    }

    req.params = result.data as typeof req.params;
    next();
  };
}

/**
 * Validates req.query against the provided Zod schema.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request query validation failed.',
          fields: errors,
        },
      });
      return;
    }

    req.query = result.data as typeof req.query;
    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
