import { z } from 'zod';

export const requestWithdrawalSchema = z.object({
  amount: z.number().positive('Withdrawal amount must be greater than zero'),
  bankCode: z.string().min(2, 'Bank code is required'),
  accountNumber: z.string().min(10, 'Valid 10-digit account number required').max(10),
  accountName: z.string().min(2, 'Account name is required'),
});

export type RequestWithdrawalDto = z.infer<typeof requestWithdrawalSchema>;
