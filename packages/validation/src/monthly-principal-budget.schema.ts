import { z } from 'zod';
import { monthYYYYMMSchema } from './constants.js';

export const setMonthlyPrincipalBudgetInputSchema = z.object({
  month: monthYYYYMMSchema,
  totalPrincipal: z.number().min(0),
  note: z.string().optional(),
});

export type SetMonthlyPrincipalBudgetInput = z.infer<
  typeof setMonthlyPrincipalBudgetInputSchema
>;

export const increaseMonthlyPrincipalBudgetInputSchema = z.object({
  month: monthYYYYMMSchema,
  delta: z.number().min(0.01),
  note: z.string().optional(),
});

export type IncreaseMonthlyPrincipalBudgetInput = z.infer<
  typeof increaseMonthlyPrincipalBudgetInputSchema
>;
