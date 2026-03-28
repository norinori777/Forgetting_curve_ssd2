import { Router } from 'express';

import { resolveCollectionOwnerId } from '../services/collectionOwnerContext.js';
import { createCardBodySchema, importCardsBodySchema, listCardsQuerySchema, validateCardImportBodySchema } from '../schemas/cards.js';
import { CardImportRepositoryError, CreateCardRepositoryError, createCard, importCards, listCards, validateCardImportRows } from '../repositories/cardRepository.js';

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
    hasAnswer: parsed.data.answer !== null && parsed.data.answer !== undefined,
    hasCollection: Boolean(parsed.data.collectionId),
    tagCount: parsed.data.tagNames.length,
  });

  try {
    const card = await createCard(parsed.data);
    logApiEvent('info', 'create-card-succeeded', {
      cardId: card.id,
      hasAnswer: card.answer !== null,
      hasCollection: Boolean(card.collectionId),
      tagCount: card.tags.length,
    });
    return res.json({ ok: true, card });
  } catch (error) {
    if (error instanceof CreateCardRepositoryError && error.code === 'COLLECTION_NOT_FOUND') {
      logApiEvent('error', 'create-card-bad-request', {
        code: error.code,
        hasAnswer: parsed.data.answer !== null && parsed.data.answer !== undefined,
        hasCollection: Boolean(parsed.data.collectionId),
        tagCount: parsed.data.tagNames.length,
      });
      return res.status(400).json({ error: 'bad_request', message: 'collection_not_found' });
    }

    logApiEvent('error', 'create-card-failed', {
      code: error instanceof CreateCardRepositoryError ? error.code : 'DATABASE_ERROR',
      hasAnswer: parsed.data.answer !== null && parsed.data.answer !== undefined,
      hasCollection: Boolean(parsed.data.collectionId),
      tagCount: parsed.data.tagNames.length,
    });
    return res.status(500).json({ error: 'database_error', message: 'failed_to_persist_card' });
  }
});

cardsRouter.post('/import/validate', async (req, res) => {
  const parsed = validateCardImportBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const ownerId = resolveCollectionOwnerId();
  logApiEvent('info', 'validate-card-import-requested', {
    ownerId,
    rowCount: parsed.data.rows.length,
    headerSkipped: parsed.data.headerSkipped,
  });

  try {
    const result = await validateCardImportRows(parsed.data.rows, ownerId, parsed.data.headerSkipped);
    return res.json({ ok: true, ...result });
  } catch (error) {
    logApiEvent('error', 'validate-card-import-failed', {
      ownerId,
      rowCount: parsed.data.rows.length,
      headerSkipped: parsed.data.headerSkipped,
      code: error instanceof Error ? error.name : 'DATABASE_ERROR',
    });
    return res.status(500).json({ error: 'database_error', message: 'failed_to_validate_card_import' });
  }
});

cardsRouter.post('/import', async (req, res) => {
  const parsed = importCardsBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const ownerId = resolveCollectionOwnerId();
  logApiEvent('info', 'import-cards-requested', {
    ownerId,
    rowCount: parsed.data.rows.length,
    headerSkipped: parsed.data.headerSkipped,
  });

  try {
    const result = await importCards(parsed.data.rows, ownerId, parsed.data.headerSkipped);
    return res.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof CardImportRepositoryError && error.code === 'VALIDATION_FAILED') {
      return res.status(409).json({
        error: 'validation_failed',
        message: error.message,
        details: error.details,
      });
    }

    logApiEvent('error', 'import-cards-failed', {
      ownerId,
      rowCount: parsed.data.rows.length,
      headerSkipped: parsed.data.headerSkipped,
      code: error instanceof CardImportRepositoryError ? error.code : 'DATABASE_ERROR',
    });
    return res.status(500).json({ error: 'database_error', message: 'failed_to_import_cards' });
  }
});