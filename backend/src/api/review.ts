import crypto from 'node:crypto';

import { Router } from 'express';

import { reviewStartRequestSchema } from '../schemas/review.js';
import { listCards } from '../repositories/cardRepository.js';

export const reviewRouter = Router();

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
            q: filter?.q,
            tagIds: filter?.tagIds,
            collectionIds: filter?.collectionIds,
            filter: filter?.filter,
            sort: filter?.sort ?? 'next_review_at',
          })
        ).items.map((card) => card.id);

  return res.json({ sessionId: crypto.randomUUID(), cardIds: resolvedCardIds });
});