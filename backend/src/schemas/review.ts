import { z } from 'zod';

export const reviewStartRequestSchema = z
  .object({
    filter: z.record(z.unknown()).optional(),
    cardIds: z.array(z.string().min(1)).optional(),
  })
  .refine((v) => (v.cardIds && v.cardIds.length > 0) || v.filter, {
    message: 'cardIds or filter is required',
    path: ['cardIds'],
  });

export type ReviewStartRequest = z.infer<typeof reviewStartRequestSchema>;
