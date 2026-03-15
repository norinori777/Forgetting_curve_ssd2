import cors from 'cors';
import express from 'express';

import { bulkRouter } from './api/bulk.js';
import { cardsRouter } from './api/cards.js';
import { collectionsRouter } from './api/collections.js';
import { reviewRouter } from './api/review.js';
import { tagsRouter } from './api/tags.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/cards', cardsRouter);
app.use('/api/cards/bulk', bulkRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/review', reviewRouter);

const port = Number(process.env.PORT ?? 3000);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`backend listening on :${port}`);
  });
}
