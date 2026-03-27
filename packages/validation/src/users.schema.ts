import { z } from 'zod';

export const createAdminInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export type CreateAdminInput = z.infer<typeof createAdminInputSchema>;

export const createFieldUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export type CreateFieldUserInput = z.infer<typeof createFieldUserInputSchema>;

export const updateUserInputSchema = z.object({
  userId: z.string().min(1),
  name: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
