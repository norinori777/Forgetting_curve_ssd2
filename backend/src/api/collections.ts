import { Router } from 'express';

import {
  CollectionRepositoryError,
  createManagedCollection,
  deleteManagedCollection,
  listManagedCollections,
  updateManagedCollection,
} from '../repositories/collectionRepository.js';
import { searchCollectionOptions } from '../repositories/cardRepository.js';
import { collectionIdParamSchema, createCollectionBodySchema, updateCollectionBodySchema } from '../schemas/collections.js';
import { optionQuerySchema } from '../schemas/options.js';
import { resolveCollectionOwnerId } from '../services/collectionOwnerContext.js';

export const collectionsRouter = Router();

function logApiEvent(level: 'info' | 'error', event: string, metadata: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'test') return;

  const payload = JSON.stringify({
    scope: 'collectionsApi',
    event,
    ...metadata,
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.info(payload);
}

function mapRepositoryError(error: unknown): { status: number; body: Record<string, unknown> } {
  if (error instanceof CollectionRepositoryError) {
    if (error.code === 'DUPLICATE_NAME') {
      return { status: 400, body: { error: 'duplicate_name', message: error.message } };
    }

    if (error.code === 'NOT_FOUND') {
      return { status: 404, body: { error: 'not_found', message: error.message } };
    }

    if (error.code === 'COLLECTION_IN_USE') {
      return { status: 409, body: { error: 'collection_in_use', message: error.message } };
    }
  }

  return { status: 500, body: { error: 'database_error', message: 'collection_management_failed' } };
}

collectionsRouter.get('/', async (req, res) => {
  const parsed = optionQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_query', details: parsed.error.flatten() });
  }

  return res.json({ items: await searchCollectionOptions(parsed.data.q, parsed.data.limit) });
});

collectionsRouter.get('/manage', async (_req, res) => {
  const ownerId = resolveCollectionOwnerId();

  try {
    const items = await listManagedCollections(ownerId);
    logApiEvent('info', 'list-managed-collections-succeeded', { ownerId, itemCount: items.length });
    return res.json({ items });
  } catch (error) {
    logApiEvent('error', 'list-managed-collections-failed', { ownerId, code: error instanceof Error ? error.name : 'UNKNOWN' });
    return res.status(500).json({ error: 'database_error', message: 'collection_management_failed' });
  }
});

collectionsRouter.post('/manage', async (req, res) => {
  const parsed = createCollectionBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const ownerId = resolveCollectionOwnerId();
  logApiEvent('info', 'create-managed-collection-requested', {
    ownerId,
    hasDescription: Boolean(parsed.data.description),
    nameLength: parsed.data.name.length,
  });

  try {
    const collection = await createManagedCollection({
      ownerId,
      name: parsed.data.name,
      description: parsed.data.description,
    });

    return res.json({ ok: true, collection });
  } catch (error) {
    const mapped = mapRepositoryError(error);
    logApiEvent('error', 'create-managed-collection-failed', {
      ownerId,
      code: error instanceof CollectionRepositoryError ? error.code : 'DATABASE_ERROR',
      nameLength: parsed.data.name.length,
    });
    return res.status(mapped.status).json(mapped.body);
  }
});

collectionsRouter.patch('/manage/:collectionId', async (req, res) => {
  const params = collectionIdParamSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: 'invalid_body', details: params.error.flatten() });
  }

  const parsed = updateCollectionBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const ownerId = resolveCollectionOwnerId();

  try {
    const collection = await updateManagedCollection({
      ownerId,
      collectionId: params.data.collectionId,
      name: parsed.data.name,
      description: parsed.data.description,
    });

    return res.json({ ok: true, collection });
  } catch (error) {
    const mapped = mapRepositoryError(error);
    logApiEvent('error', 'update-managed-collection-failed', {
      ownerId,
      collectionId: params.data.collectionId,
      code: error instanceof CollectionRepositoryError ? error.code : 'DATABASE_ERROR',
    });
    return res.status(mapped.status).json(mapped.body);
  }
});

collectionsRouter.delete('/manage/:collectionId', async (req, res) => {
  const params = collectionIdParamSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({ error: 'invalid_body', details: params.error.flatten() });
  }

  const ownerId = resolveCollectionOwnerId();

  try {
    await deleteManagedCollection(ownerId, params.data.collectionId);
    return res.json({ ok: true, deletedId: params.data.collectionId });
  } catch (error) {
    const mapped = mapRepositoryError(error);
    logApiEvent('error', 'delete-managed-collection-failed', {
      ownerId,
      collectionId: params.data.collectionId,
      code: error instanceof CollectionRepositoryError ? error.code : 'DATABASE_ERROR',
    });
    return res.status(mapped.status).json(mapped.body);
  }
});