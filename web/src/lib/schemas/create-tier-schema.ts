/**
 * Zod schema for creating a new subscription tier
 */

import { z } from 'zod';

export const createTierFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  monthlyPrice: z
    .number()
    .min(0.01, 'Price must be at least 0.01 USDC')
    .max(999999.99, 'Price is too high'),
});

export type CreateTierFormData = z.infer<typeof createTierFormSchema>;
