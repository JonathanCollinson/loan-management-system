import { z } from 'zod';

export const updateSystemConfigInputSchema = z.object({
  defaultInterestRate: z.number().min(0),
});

export type UpdateSystemConfigInput = z.infer<
  typeof updateSystemConfigInputSchema
>;
