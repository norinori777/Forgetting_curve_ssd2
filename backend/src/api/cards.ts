import { Router } from 'express';

import { createCardBodySchema, listCardsQuerySchema } from '../schemas/cards.js';
import { CreateCardRepositoryError, createCard, listCards } from '../repositories/cardRepository.js';

export const cardsRouter = Router();

function logApiEvent(level: 'info' | 'error', event: string, metadata: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'test') return;

  const payload = JSON.stringify({
    scope: 'cardsApi',
    event,
    ...metadata,
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.info(payload);
}

cardsRouter.get('/', async (req, res) => {
  const parsed = listCardsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_query', details: parsed.error.flatten() });
  }

  try {
    const result = await listCards(parsed.data);
    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return res.status(400).json({ error: 'bad_request', message });
  }
});

cardsRouter.post('/', async (req, res) => {
  const parsed = createCardBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  logApiEvent('info', 'create-card-requested', {
    hasCollection: Boolean(parsed.data.collectionId),
    tagCount: parsed.data.tagNames.length,
  });

  try {
    const card = await createCard(parsed.data);
    logApiEvent('info', 'create-card-succeeded', {
      cardId: card.id,
      hasCollection: Boolean(card.collectionId),
      tagCount: card.tags.length,
    });
    return res.json({ ok: true, card });
  } catch (error) {
    if (error instanceof CreateCardRepositoryError && error.code === 'COLLECTION_NOT_FOUND') {
      logApiEvent('error', 'create-card-bad-request', {
        code: error.code,
        hasCollection: Boolean(parsed.data.collectionId),
        tagCount: parsed.data.tagNames.length,
      });
      return res.status(400).json({ error: 'bad_request', message: 'collection_not_found' });
    }

    logApiEvent('error', 'create-card-failed', {
      code: error instanceof CreateCardRepositoryError ? error.code : 'DATABASE_ERROR',
      hasCollection: Boolean(parsed.data.collectionId),
      tagCount: parsed.data.tagNames.length,
    });
    return res.status(500).json({ error: 'database_error', message: 'failed_to_persist_card' });
  }
});