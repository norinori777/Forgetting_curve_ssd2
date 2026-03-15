import { Router } from 'express';

import { searchTagOptions } from '../repositories/cardRepository.js';
import { optionQuerySchema } from '../schemas/options.js';

export const tagsRouter = Router();

tagsRouter.get('/', async (req, res) => {
  const parsed = optionQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_query', details: parsed.error.flatten() });
  }

  return res.json({ items: await searchTagOptions(parsed.data.q, parsed.data.limit) });
});