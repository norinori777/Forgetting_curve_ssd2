import { Router } from 'express';

import { listCardsQuerySchema } from '../schemas/cards.js';
import { listCards } from '../repositories/cardRepository.js';

export const cardsRouter = Router();

cardsRouter.get('/', async (req, res) => {
  const parsed = listCardsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_query', details: parsed.error.flatten() });
  }

  try {
    const result = await listCards(parsed.data);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: 'bad_request', message: err?.message ?? 'unknown error' });
  }
});
