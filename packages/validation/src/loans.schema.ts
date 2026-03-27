import { z } from 'zod';
import { interestTypeSchema } from './constants.js';

export const createLoanInputSchema = z.object({
  borrowerId: z.string().min(1),
  principalFundId: z.string().min(1),
  principalAmount: z.number().min(0.01),
  interestRate: z.number().min(0).optional(),
  interestType: interestTypeSchema,
  termMonths: z.number().int().min(1).optional(),
  startDate: z
    .string()
    .optional()
    .refine(
      (s) => s === undefined || !Number.isNaN(Date.parse(s)),
      'Invalid date',
    ),
});

export type CreateLoanInput = z.infer<typeof createLoanInputSchema>;

export const updateLoanInputSchema = z.object({
  loanId: z.string().min(1),
  interestRate: z.number().min(0).optional(),
  termMonths: z.number().int().min(1).optional(),
});

export type UpdateLoanInput = z.infer<typeof updateLoanInputSchema>;

export const rolloverLoanInputSchema = z.object({
  loanId: z.string().min(1),
  interestPercentOnOutstanding: z.number().min(0).optional(),
});

export type RolloverLoanInput = z.infer<typeof rolloverLoanInputSchema>;
