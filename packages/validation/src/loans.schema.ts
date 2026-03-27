import { z } from 'zod';
import { interestTypeSchema } from './constants.js';

export const createLoanInputSchema = z.object({
  borrowerId: z.string().min(1),
  principalAmount: z.number().min(0.01),
  interestRate: z.number().min(0).optional(),
  interestType: interestTypeSchema,
  termMonths: z.number().int().min(1),
  startDate: z
    .string()
    .optional()
    .refine(
      (s) => s === undefined || !Number.isNaN(Date.parse(s)),
      'Invalid date',
    ),
});

export type CreateLoanInput = z.infer<typeof createLoanInputSchema>;
