import { z } from 'zod';

export const createPoolSchema = z.object({
  name: z.string().min(2, 'Pool name must be at least 2 characters'),
  description: z.string().optional(),
  currency: z.string().length(3).default('NGN'),
});

export const updatePoolSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  currency: z.string().length(3).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['OWNER', 'MEMBER']).default('MEMBER'),
});

export type CreatePoolDto = z.infer<typeof createPoolSchema>;
export type UpdatePoolDto = z.infer<typeof updatePoolSchema>;
export type AddMemberDto = z.infer<typeof addMemberSchema>;
