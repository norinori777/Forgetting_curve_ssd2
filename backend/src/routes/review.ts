import crypto from 'node:crypto';

import { Router } from 'express';

import { reviewStartRequestSchema } from '../schemas/review.js';
import { listCards } from '../repositories/cardRepository.js';

export const reviewRouter = Router();

function resolveSort(value: unknown): 'next_review_at' | 'proficiency' | 'created_at' {
  if (value === 'next_review_at' || value === 'proficiency' || value === 'created_at') {
    return value;
  }
  return 'next_review_at';
}

reviewRouter.post('/start', async (req, res) => {
  const parsed = reviewStartRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const { cardIds, filter } = parsed.data;

  const resolvedCardIds =
    cardIds && cardIds.length > 0
      ? cardIds
      : (
          await listCards({
            cursor: undefined,
            limit: 200,
            q: typeof filter?.q === 'string' ? filter.q : undefined,
            tags: typeof filter?.tags === 'string' ? filter.tags : undefined,
            collection: typeof filter?.collection === 'string' ? filter.collection : undefined,
            filter: typeof filter?.filter === 'string' ? filter.filter : undefined,
            sort: resolveSort(filter?.sort),
          })
        ).items.map((c) => c.id);

  const sessionId = crypto.randomUUID();

  return res.json({ sessionId, cardIds: resolvedCardIds });
});
