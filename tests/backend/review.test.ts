import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Store = {
  cards: Array<{
    id: string;
    title: string;
    content: string;
    collectionId: string | null;
    proficiency: number;
    nextReviewAt: Date;
    lastCorrectRate: number;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  tags: Array<{ id: string; name: string }>;
  cardTags: Array<{ cardId: string; tagId: string }>;
};

let store: Store;

function matchScalar(value: unknown, condition: any): boolean {
  if (condition && typeof condition === 'object' && Array.isArray(condition.in)) {
    return condition.in.includes(value);
  }
  return value === condition;
}

function matchWhere(card: Store['cards'][number], where: any): boolean {
  if (!where) return true;
  if (where.AND) return where.AND.every((part: any) => matchWhere(card, part));
  if (where.OR) return where.OR.some((part: any) => matchWhere(card, part));

  for (const [key, cond] of Object.entries(where)) {
    if (key === 'collectionId' && !matchScalar(card.collectionId, cond)) return false;
    if (key === 'isArchived' && !matchScalar(card.isArchived, cond)) return false;
    if (key === 'tags') {
      const ok = store.cardTags.some((row) => {
        if (row.cardId !== card.id) return false;
        return (cond as any).some.OR.some((orCond: any) => {
          if (orCond.tagId) return matchScalar(row.tagId, orCond.tagId);
          const tag = store.tags.find((item) => item.id === row.tagId);
          return matchScalar(tag?.name, orCond.tag?.name);
        });
      });
      if (!ok) return false;
    }
  }

  return true;
}

const prisma = {
  card: {
    findMany: async (args: any) => {
      return store.cards
        .filter((card) => matchWhere(card, args.where))
        .slice(0, args.take ?? store.cards.length)
        .map((card) => ({
          ...card,
          tags: store.cardTags
            .filter((row) => row.cardId === card.id)
            .map((row) => ({ tagId: row.tagId, tag: store.tags.find((tag) => tag.id === row.tagId) })),
        }));
    },
  },
};

vi.mock('../../backend/src/db/prisma.js', () => ({ prisma }));

describe('backend review API', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    store = {
      cards: [
        {
          id: 'c1',
          title: 'Card 1',
          content: 'one',
          collectionId: 'col1',
          proficiency: 0,
          nextReviewAt: new Date('2026-03-07T00:00:00.000Z'),
          lastCorrectRate: 0,
          isArchived: false,
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-01T00:00:00.000Z'),
        },
        {
          id: 'c2',
          title: 'Card 2',
          content: 'two',
          collectionId: 'col2',
          proficiency: 0,
          nextReviewAt: new Date('2026-03-08T00:00:00.000Z'),
          lastCorrectRate: 0,
          isArchived: false,
          createdAt: new Date('2026-03-02T00:00:00.000Z'),
          updatedAt: new Date('2026-03-02T00:00:00.000Z'),
        },
      ],
      tags: [{ id: 'tag1', name: 'tag1' }],
      cardTags: [{ cardId: 'c1', tagId: 'tag1' }],
    };
  });

  it('starts review with array-based filters', async () => {
    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .post('/api/review/start')
      .send({
        filter: {
          sort: 'next_review_at',
          tagIds: ['tag1'],
          collectionIds: ['col1'],
        },
      })
      .expect(200);

    expect(res.body.sessionId).toBeTruthy();
    expect(res.body.cardIds).toEqual(['c1']);
  });

  it('prefers explicit cardIds when both cardIds and filter are provided', async () => {
    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .post('/api/review/start')
      .send({
        cardIds: ['c2'],
        filter: {
          sort: 'next_review_at',
          tagIds: ['tag1'],
          collectionIds: ['col1'],
        },
      })
      .expect(200);

    expect(res.body.sessionId).toBeTruthy();
    expect(res.body.cardIds).toEqual(['c2']);
  });

  it('rejects review start requests without filter and cardIds', async () => {
    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app).post('/api/review/start').send({}).expect(400);

    expect(res.body.error).toBe('invalid_body');
  });
});