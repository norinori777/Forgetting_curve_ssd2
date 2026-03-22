import { Router, type Response } from 'express';

import {
  reviewNavigateRequestSchema,
  reviewStartRequestSchema,
  reviewUpdateAssessmentRequestSchema,
} from '../schemas/review.js';
import { listCards } from '../repositories/cardRepository.js';
import {
  createReviewSession,
  getReviewSessionSnapshot,
  navigateReviewSession,
  saveReviewAssessment,
} from '../repositories/reviewSessionRepository.js';
import { ReviewRepositoryError } from '../domain/review.js';

export const reviewRouter = Router();

function mapReviewError(error: unknown, res: Response) {
  if (error instanceof ReviewRepositoryError) {
    if (error.code === 'SESSION_NOT_FOUND') return res.status(404).json({ error: error.message });
    if (error.code === 'NO_CARDS') return res.status(404).json({ error: error.message });
    if (error.code === 'ASSESSMENT_REQUIRED' || error.code === 'CARD_LOCKED' || error.code === 'NOT_CURRENT_CARD') {
      return res.status(409).json({ error: error.message });
    }
  }

  return res.status(503).json({ error: 'review_temporary_failure' });
}

reviewRouter.post('/start', async (req, res) => {
  const parsed = reviewStartRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const { cardIds, filter } = parsed.data;

  try {
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

    if (resolvedCardIds.length === 0) {
      return res.status(404).json({ error: 'review_session_has_no_cards' });
    }

    const snapshot = await createReviewSession({ cardIds: resolvedCardIds, filter });
    return res.json({ snapshot });
  } catch (error) {
    return mapReviewError(error, res);
  }
});

reviewRouter.get('/sessions/:sessionId', async (req, res) => {
  try {
    const snapshot = await getReviewSessionSnapshot(req.params.sessionId);
    return res.json(snapshot);
  } catch (error) {
    return mapReviewError(error, res);
  }
});

reviewRouter.put('/sessions/:sessionId/assessment', async (req, res) => {
  const parsed = reviewUpdateAssessmentRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  try {
    const snapshot = await saveReviewAssessment(req.params.sessionId, parsed.data.cardId, parsed.data.assessment);
    return res.json(snapshot);
  } catch (error) {
    return mapReviewError(error, res);
  }
});

reviewRouter.post('/sessions/:sessionId/navigation', async (req, res) => {
  const parsed = reviewNavigateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  try {
    const snapshot = await navigateReviewSession(req.params.sessionId, parsed.data.direction);
    return res.json(snapshot);
  } catch (error) {
    return mapReviewError(error, res);
  }
});