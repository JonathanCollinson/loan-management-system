import { z } from 'zod';
import { periodYYYYMMSchema } from './constants.js';

export const recordFundingInputSchema = z.object({
  recipientUserId: z.string().min(1),
  capitalFundId: z.string().min(1),
  amount: z.number().min(0.01),
  note: z.string().optional(),
  period: periodYYYYMMSchema.optional(),
});

export type RecordFundingInput = z.infer<typeof recordFundingInputSchema>;
