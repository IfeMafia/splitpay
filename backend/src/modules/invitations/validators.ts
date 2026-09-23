import { z } from 'zod';

export const createEmailInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export const createCodeInviteSchema = z.object({
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export type CreateEmailInviteDto = z.infer<typeof createEmailInviteSchema>;
export type CreateCodeInviteDto = z.infer<typeof createCodeInviteSchema>;
