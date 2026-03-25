import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type CardRow = {
  id: string;
  title: string;
  content: string;
  answer: string | null;
  collectionId: string | null;
  proficiency: number;
  nextReviewAt: Date;
  lastCorrectRate: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type TagRow = { id: string; name: string };
type CollectionRow = { id: string; name: string; ownerId: string };
type CardTagRow = { cardId: string; tagId: string };
type ReviewSessionRow = {
  id: string;
  status: 'in_progress' | 'completed';
  currentCardIndex: number;
  totalCards: number;
  sourceQuery: string | null;
  sourceFilter: 'today' | 'overdue' | 'unlearned' | null;
  sourceSort: 'next_review_at' | 'proficiency' | 'created_at';
  sourceTagLabels: string[];
  sourceCollectionLabels: string[];
  sourceTargetResolution: {
    matchedCount: number;
    includedCount: number;
    excludedCount: number;
    exclusionBreakdown: Array<{ reason: 'over_limit' | 'unavailable'; count: number }>;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

type ReviewSessionCardRow = {
  sessionId: string;
  cardId: string;
  orderIndex: number;
  assessment: 'forgot' | 'uncertain' | 'remembered' | 'perfect' | null;
  assessedAt: Date | null;
  lockedAt: Date | null;
};

type Store = {
  cards: CardRow[];
  tags: TagRow[];
  collections: CollectionRow[];
  cardTags: CardTagRow[];
  reviewSessions: ReviewSessionRow[];
  reviewSessionCards: ReviewSessionCardRow[];
};

let store: Store;

function makeStore(): Store {
  return {
    cards: [
      {
        id: 'c1',
        title: 'Card 1',
        content: 'question one',
        answer: 'answer one',
        collectionId: 'col1',
        proficiency: 0,
        nextReviewAt: new Date('2026-03-07T00:00:00.000Z'),
        lastCorrectRate: 0.1,
        isArchived: false,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
      {
        id: 'c2',
        title: 'Card 2',
        content: 'question two',
        answer: 'answer two',
        collectionId: null,
        proficiency: 2,
        nextReviewAt: new Date('2026-03-08T00:00:00.000Z'),
        lastCorrectRate: 0.4,
        isArchived: false,
        createdAt: new Date('2026-03-02T00:00:00.000Z'),
        updatedAt: new Date('2026-03-02T00:00:00.000Z'),
      },
    ],
    tags: [{ id: 'tag1', name: 'tag1' }],
    collections: [{ id: 'col1', name: 'TOEIC', ownerId: 'owner-1' }],
    cardTags: [{ cardId: 'c1', tagId: 'tag1' }],
    reviewSessions: [],
    reviewSessionCards: [],
  };
}

function buildCardRow(index: number): CardRow {
  return {
    id: `c${index}`,
    title: `Card ${index}`,
    content: `question ${index}`,
    answer: `answer ${index}`,
    collectionId: index % 2 === 0 ? 'col1' : null,
    proficiency: index % 4,
    nextReviewAt: new Date(`2026-03-${String(((index - 1) % 28) + 1).padStart(2, '0')}T00:00:00.000Z`),
    lastCorrectRate: 0.1,
    isArchived: false,
    createdAt: new Date(`2026-02-${String(((index - 1) % 28) + 1).padStart(2, '0')}T00:00:00.000Z`),
    updatedAt: new Date(`2026-02-${String(((index - 1) % 28) + 1).padStart(2, '0')}T00:00:00.000Z`),
  };
}

function applyCardFilters(args: any): CardRow[] {
  let cards = store.cards.filter((card) => !card.isArchived);
  const and = args?.where?.AND as any[] | undefined;

  if (and) {
    for (const part of and) {
      if (part.OR && Array.isArray(part.OR)) {
        cards = cards.filter((card) =>
          part.OR.some((entry: any) => {
            if (entry.title?.contains) return card.title.toLowerCase().includes(String(entry.title.contains).toLowerCase());
            if (entry.content?.contains) return card.content.toLowerCase().includes(String(entry.content.contains).toLowerCase());
            if (entry.answer?.contains) return (card.answer ?? '').toLowerCase().includes(String(entry.answer.contains).toLowerCase());
            return false;
          }),
        );
      }
      if (part.collectionId?.in) cards = cards.filter((card) => part.collectionId.in.includes(card.collectionId));
      if (part.tags?.some?.OR) {
        const allowed = part.tags.some.OR.flatMap((entry: any) => [entry.tagId, entry.tag?.name?.in]).flat().filter(Boolean);
        cards = cards.filter((card) =>
          store.cardTags.some((row) => row.cardId === card.id && allowed.includes(row.tagId)) ||
          store.cardTags.some((row) => row.cardId === card.id && allowed.includes(store.tags.find((tag) => tag.id === row.tagId)?.name)),
        );
      }
      if (part.proficiency === 0) cards = cards.filter((card) => card.proficiency === 0);
      if (part.nextReviewAt?.lte) cards = cards.filter((card) => card.nextReviewAt <= new Date(part.nextReviewAt.lte));
      if (part.nextReviewAt?.lt) cards = cards.filter((card) => card.nextReviewAt < new Date(part.nextReviewAt.lt));
    }
  }

  const orderBy = args?.orderBy ?? [];
  cards.sort((left, right) => {
    for (const order of orderBy) {
      if (order.nextReviewAt) {
        const diff = left.nextReviewAt.getTime() - right.nextReviewAt.getTime();
        if (diff !== 0) return diff;
      }
      if (order.createdAt) {
        const diff = left.createdAt.getTime() - right.createdAt.getTime();
        if (diff !== 0) return diff;
      }
      if (order.proficiency) {
        const diff = left.proficiency - right.proficiency;
        if (diff !== 0) return diff;
      }
      if (order.id) {
        const diff = left.id.localeCompare(right.id);
        if (diff !== 0) return diff;
      }
    }
    return 0;
  });

  if (typeof args?.take === 'number') {
    cards = cards.slice(0, args.take);
  }

  return cards;
}

function makeJoinedCard(cardId: string) {
  const card = store.cards.find((item) => item.id === cardId)!;
  return {
    ...card,
    collection: card.collectionId ? { name: store.collections.find((collection) => collection.id === card.collectionId)?.name ?? '' } : null,
    tags: store.cardTags.filter((row) => row.cardId === cardId).map((row) => ({ tag: store.tags.find((tag) => tag.id === row.tagId) ?? null })),
  };
}

const prisma = {
  card: {
    findMany: async (args: any) => {
      const cards = applyCardFilters(args);
      if (args?.select?.id) {
        return cards.map((card) => ({ id: card.id }));
      }
      return cards.map((card) => ({
        ...card,
        tags: store.cardTags.filter((row) => row.cardId === card.id).map((row) => ({ tagId: row.tagId, tag: store.tags.find((tag) => tag.id === row.tagId) })),
      }));
    },
    count: async (args: any) => applyCardFilters(args).length,
  },
  tag: {
    findMany: async (args: any) => {
      const ids = args?.where?.id?.in ?? [];
      return store.tags.filter((tag) => ids.includes(tag.id));
    },
  },
  collection: {
    findMany: async (args: any) => {
      const ids = args?.where?.id?.in ?? [];
      return store.collections.filter((collection) => ids.includes(collection.id));
    },
  },
  reviewSession: {
    create: async ({ data }: any) => {
      const row: ReviewSessionRow = {
        id: `session-${store.reviewSessions.length + 1}`,
        status: data.status,
        currentCardIndex: data.currentCardIndex,
        totalCards: data.totalCards,
        sourceQuery: data.sourceQuery ?? null,
        sourceFilter: data.sourceFilter ?? null,
        sourceSort: data.sourceSort,
        sourceTagLabels: data.sourceTagLabels ?? [],
        sourceCollectionLabels: data.sourceCollectionLabels ?? [],
        sourceTargetResolution: data.sourceTargetResolution ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };
      store.reviewSessions.push(row);
      return row;
    },
    findUnique: async ({ where }: any) => {
      const session = store.reviewSessions.find((item) => item.id === where.id);
      if (!session) return null;
      return {
        ...session,
        cards: store.reviewSessionCards
          .filter((card) => card.sessionId === session.id)
          .sort((left, right) => left.orderIndex - right.orderIndex)
          .map((row) => ({ ...row, card: makeJoinedCard(row.cardId) })),
      };
    },
    update: async ({ where, data }: any) => {
      const session = store.reviewSessions.find((item) => item.id === where.id)!;
      Object.assign(session, data, { updatedAt: new Date() });
      return session;
    },
  },
  reviewSessionCard: {
    createMany: async ({ data }: any) => {
      for (const row of data) {
        store.reviewSessionCards.push({
          sessionId: row.sessionId,
          cardId: row.cardId,
          orderIndex: row.orderIndex,
          assessment: null,
          assessedAt: null,
          lockedAt: null,
        });
      }
      return { count: data.length };
    },
    update: async ({ where, data }: any) => {
      const row = store.reviewSessionCards.find((item) => item.sessionId === where.sessionId_cardId.sessionId && item.cardId === where.sessionId_cardId.cardId)!;
      Object.assign(row, data);
      return row;
    },
  },
  $transaction: async (callback: any) => callback(prisma),
};

vi.mock('../../backend/src/db/prisma.js', () => ({ prisma }));

describe('backend review API', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    store = makeStore();
    vi.restoreAllMocks();
  });

  it('starts review and returns a snapshot with filter labels', async () => {
    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .post('/api/review/start')
      .send({
        cardIds: ['c1', 'c2'],
        filter: {
          sort: 'next_review_at',
          tagIds: ['tag1'],
          collectionIds: ['col1'],
        },
      })
      .expect(200);

    expect(res.body.snapshot.sessionId).toBeTruthy();
    expect(res.body.snapshot.totalCount).toBe(2);
    expect(res.body.snapshot.filterSummary.tagLabels).toEqual(['tag1']);
    expect(res.body.snapshot.filterSummary.collectionLabels).toEqual(['TOEIC']);
    expect(res.body.snapshot.currentCard.reviewReason.label).toBeTruthy();
  });

  it('rejects next before assessment and allows overwrite before advancing', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const start = await request(app).post('/api/review/start').send({ cardIds: ['c1', 'c2'] }).expect(200);
    const sessionId = start.body.snapshot.sessionId as string;

    await request(app).post(`/api/review/sessions/${sessionId}/navigation`).send({ direction: 'next' }).expect(409);

    const firstSave = await request(app)
      .put(`/api/review/sessions/${sessionId}/assessment`)
      .send({ cardId: 'c1', assessment: 'forgot' })
      .expect(200);
    expect(firstSave.body.currentCard.currentAssessment).toBe('forgot');

    const overwrite = await request(app)
      .put(`/api/review/sessions/${sessionId}/assessment`)
      .send({ cardId: 'c1', assessment: 'remembered' })
      .expect(200);
    expect(overwrite.body.currentCard.currentAssessment).toBe('remembered');
  });

  it('locks the previous card after next and completes on the last card', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const start = await request(app).post('/api/review/start').send({ cardIds: ['c1', 'c2'] }).expect(200);
    const sessionId = start.body.snapshot.sessionId as string;

    await request(app).put(`/api/review/sessions/${sessionId}/assessment`).send({ cardId: 'c1', assessment: 'perfect' }).expect(200);
    const next = await request(app).post(`/api/review/sessions/${sessionId}/navigation`).send({ direction: 'next' }).expect(200);
    expect(next.body.currentIndex).toBe(1);

    const prev = await request(app).post(`/api/review/sessions/${sessionId}/navigation`).send({ direction: 'prev' }).expect(200);
    expect(prev.body.currentCard.locked).toBe(true);

    await request(app).put(`/api/review/sessions/${sessionId}/assessment`).send({ cardId: 'c1', assessment: 'forgot' }).expect(409);

    await request(app).post(`/api/review/sessions/${sessionId}/navigation`).send({ direction: 'next' }).expect(200);
    await request(app).put(`/api/review/sessions/${sessionId}/assessment`).send({ cardId: 'c2', assessment: 'uncertain' }).expect(200);
    const completed = await request(app).post(`/api/review/sessions/${sessionId}/navigation`).send({ direction: 'next' }).expect(200);
    expect(completed.body.status).toBe('completed');
    expect(completed.body.summary.assessedCount).toBe(2);
  });

  it('returns 404 for no cards and missing sessions', async () => {
    const { app } = await import('../../backend/src/index.ts');
    store.cards = [];

    await request(app).post('/api/review/start').send({ filter: { sort: 'next_review_at', tagIds: [], collectionIds: [] } }).expect(404);
    await request(app).get('/api/review/sessions/missing').expect(404);
  });

  it('caps filter-based review start at 200 cards and persists targetResolution metadata', async () => {
    const { app } = await import('../../backend/src/index.ts');
    store.cards = Array.from({ length: 205 }, (_, index) => buildCardRow(index + 1));
    store.cardTags = [];

    const res = await request(app)
      .post('/api/review/start')
      .send({ filter: { sort: 'next_review_at', tagIds: [], collectionIds: [] } })
      .expect(200);

    expect(res.body.snapshot.totalCount).toBe(200);
    expect(res.body.snapshot.filterSummary.targetResolution).toEqual({
      matchedCount: 205,
      includedCount: 200,
      excludedCount: 5,
      exclusionBreakdown: [{ reason: 'over_limit', count: 5 }],
    });

    const followUp = await request(app).get(`/api/review/sessions/${res.body.snapshot.sessionId}`).expect(200);
    expect(followUp.body.filterSummary.targetResolution.excludedCount).toBe(5);
  });

  it('reports unavailable explicit card ids in targetResolution metadata', async () => {
    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .post('/api/review/start')
      .send({ cardIds: ['c1', 'missing', 'c2'] })
      .expect(200);

    expect(res.body.snapshot.totalCount).toBe(2);
    expect(res.body.snapshot.filterSummary.targetResolution).toEqual({
      matchedCount: 3,
      includedCount: 2,
      excludedCount: 1,
      exclusionBreakdown: [{ reason: 'unavailable', count: 1 }],
    });
  });

  it('returns 503 on temporary repository failures', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const spy = vi.spyOn(prisma.reviewSession, 'findUnique').mockRejectedValueOnce(new Error('db down'));

    await request(app).get('/api/review/sessions/any').expect(503);

    spy.mockRestore();
  });
});