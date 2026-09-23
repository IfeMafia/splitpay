import { z } from 'zod';

export const configureSplitSchema = z.object({
  type: z.enum(['EQUAL', 'CUSTOM']),
  shares: z.array(
    z.object({
      memberId: z.string().uuid(),
      percentage: z.number().min(0).max(100),
    }),
  ).optional(),
}).refine((data) => {
  if (data.type === 'CUSTOM') {
    if (!data.shares || data.shares.length === 0) return false;
    const sum = data.shares.reduce((acc, s) => acc + s.percentage, 0);
    return Math.abs(sum - 100) < 0.01;
  }
  return true;
}, {
  message: 'Custom split requires shares summing to exactly 100%',
  path: ['shares'],
});

export type ConfigureSplitDto = z.infer<typeof configureSplitSchema>;
