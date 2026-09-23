import { z } from 'zod';

export const createPaymentLinkSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().length(3).default('NGN'),
});

export const updatePaymentLinkSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  amount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const initializePaymentSchema = z.object({
  payerEmail: z.string().email('Valid email is required'),
  payerName: z.string().min(2, 'Payer name is required'),
});

export type CreatePaymentLinkDto = z.infer<typeof createPaymentLinkSchema>;
export type UpdatePaymentLinkDto = z.infer<typeof updatePaymentLinkSchema>;
export type InitializePaymentDto = z.infer<typeof initializePaymentSchema>;
