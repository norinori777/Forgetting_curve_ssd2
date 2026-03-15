import { z } from 'zod';

export const optionQuerySchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type OptionQuery = z.infer<typeof optionQuerySchema>;