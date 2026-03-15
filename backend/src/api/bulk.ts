import { Router } from 'express';

import { bulkRequestSchema } from '../schemas/bulk.js';
import { addTagsToCards, archiveCards, deleteCards, removeTagsFromCards } from '../repositories/cardRepository.js';

export const bulkRouter = Router();

bulkRouter.post('/', async (req, res) => {
  const parsed = bulkRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const { action, cardIds, tagIds } = parsed.data;

  if ((action === 'addTags' || action === 'removeTags') && (!tagIds || tagIds.length === 0)) {
    return res.status(400).json({ error: 'invalid_body', message: 'tagIds is required for tag actions' });
  }

  switch (action) {
    case 'archive': {
      const archived = await archiveCards(cardIds);
      return res.json({ ok: true, archived });
    }
    case 'delete': {
      const deleted = await deleteCards(cardIds);
      return res.json({ ok: true, deleted });
    }
    case 'addTags': {
      await addTagsToCards(cardIds, tagIds ?? []);
      return res.json({ ok: true });
    }
    case 'removeTags': {
      const removed = await removeTagsFromCards(cardIds, tagIds ?? []);
      return res.json({ ok: true, removed });
    }
  }
});