import { z } from 'zod';

export const updateSystemConfigInputSchema = z
  .object({
    defaultInterestRate: z.number().min(0).optional(),
    defaultTermMonths: z.number().int().min(1).optional(),
    globalRolloverMode: z.enum(['AUTO', 'MANUAL']).optional(),
  })
  .refine(
    (d) =>
      d.defaultInterestRate != null ||
      d.defaultTermMonths != null ||
      d.globalRolloverMode != null,
    { message: 'At least one field is required' },
  );

export type UpdateSystemConfigInput = z.infer<
  typeof updateSystemConfigInputSchema
>;
