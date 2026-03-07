import { z } from 'zod';

export const bulkActionSchema = z.enum([
  'archive',
  'delete',
  'addTags',
  'removeTags',
]);

export const bulkRequestSchema = z.object({
  action: bulkActionSchema,
  cardIds: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).optional(),
});

export type BulkRequest = z.infer<typeof bulkRequestSchema>;
