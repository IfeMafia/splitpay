import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().optional().nullable(),
  defaultCurrency: z.string().length(3).optional(),
  country: z.string().length(2).optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
