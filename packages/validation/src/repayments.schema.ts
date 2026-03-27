import { z } from 'zod';
import { paymentMethodSchema } from './constants.js';

export const addRepaymentInputSchema = z.object({
  loanId: z.string().min(1),
  amount: z.number().min(0.01),
  paymentDate: z
    .string()
    .optional()
    .refine(
      (s) => s === undefined || !Number.isNaN(Date.parse(s)),
      'Invalid date',
    ),
  method: paymentMethodSchema,
});

export type AddRepaymentInput = z.infer<typeof addRepaymentInputSchema>;
