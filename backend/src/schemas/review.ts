import { z } from 'zod';

const cardListFilterSchema = z.object({
  q: z.string().trim().optional(),
  filter: z.enum(['today', 'overdue', 'unlearned']).optional(),
  sort: z.enum(['next_review_at', 'proficiency', 'created_at']).optional(),
  tagIds: z.array(z.string().min(1)).optional(),
  collectionIds: z.array(z.string().min(1)).optional(),
});

export const reviewStartRequestSchema = z
  .object({
    filter: cardListFilterSchema.optional(),
    cardIds: z.array(z.string().min(1)).optional(),
  })
  .refine((v) => (v.cardIds && v.cardIds.length > 0) || v.filter, {
    message: 'cardIds or filter is required',
    path: ['cardIds'],
  });

export type ReviewStartRequest = z.infer<typeof reviewStartRequestSchema>;
