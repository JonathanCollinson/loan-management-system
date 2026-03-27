import { z } from 'zod';
import { borrowerAudienceSchema } from './constants.js';

export const createBorrowerInputSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().min(1),
  ownerUserId: z.string().optional(),
  audience: borrowerAudienceSchema.optional(),
});

export type CreateBorrowerInput = z.infer<typeof createBorrowerInputSchema>;

export const updateBorrowerInputSchema = z.object({
  borrowerId: z.string().min(1),
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type UpdateBorrowerInput = z.infer<typeof updateBorrowerInputSchema>;
