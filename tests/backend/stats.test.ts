import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type CardRow = {
  id: string;
  isArchived: boolean;
  createdAt: Date;
};

type ReviewSessionCardRow = {
  sessionId: string;
  cardId: string;
  assessment: string | null;
  assessedAt: Date | null;
};

type TagRow = {
  id: string;
  name: string;
};

type CardTagRow = {
  cardId: string;
  tagId: string;
};

type Store = {
  cards: CardRow[];
  reviewSessionCards: ReviewSessionCardRow[];
  tags: TagRow[];
  cardTags: CardTagRow[];
};

let store: Store;

function makeStore(): Store {
  return {
    cards: [
      { id: 'c1', isArchived: false, createdAt: new Date('2026-03-27T08:00:00.000Z') },
      { id: 'c2', isArchived: false, createdAt: new Date('2026-03-26T08:00:00.000Z') },
      { id: 'c3', isArchived: false, createdAt: new Date('2026-03-15T08:00:00.000Z') },
      { id: 'c4', isArchived: true, createdAt: new Date('2026-03-28T08:00:00.000Z') },
    ],
    reviewSessionCards: [
      { sessionId: 's1', cardId: 'c1', assessment: 'remembered', assessedAt: new Date('2026-03-28T09:00:00.000Z') },
      { sessionId: 's2', cardId: 'c2', assessment: 'forgot', assessedAt: new Date('2026-03-27T09:00:00.000Z') },
      { sessionId: 's3', cardId: 'c1', assessment: 'perfect', assessedAt: new Date('2026-03-26T09:00:00.000Z') },
      { sessionId: 's4', cardId: 'c3', assessment: 'uncertain', assessedAt: new Date('2026-03-21T09:00:00.000Z') },
      { sessionId: 's5', cardId: 'c3', assessment: 'remembered', assessedAt: new Date('2026-03-20T09:00:00.000Z') },
      { sessionId: 's6', cardId: 'c2', assessment: 'remembered', assessedAt: new Date('2026-03-25T09:00:00.000Z') },
    ],
    tags: [
      { id: 't1', name: '語彙' },
      { id: 't2', name: '文法' },
      { id: 't3', name: 'リスニング' },
    ],
    cardTags: [
      { cardId: 'c1', tagId: 't1' },
      { cardId: 'c2', tagId: 't2' },
      { cardId: 'c3', tagId: 't3' },
    ],
  };
}

const prisma = {
  card: {
    count: async ({ where }: any) => {
      return store.cards.filter((card) => {
        if (where?.isArchived !== undefined && card.isArchived !== where.isArchived) return false;
        if (where?.createdAt?.gte && !(card.createdAt >= where.createdAt.gte)) return false;
        if (where?.createdAt?.lte && !(card.createdAt <= where.createdAt.lte)) return false;
        return true;
      }).length;
    },
  },
  reviewSessionCard: {
    findMany: async ({ where, select }: any) => {
      const rows = store.reviewSessionCards.filter((row) => {
        const card = store.cards.find((item) => item.id === row.cardId);
        if (where?.card?.isArchived !== undefined && card?.isArchived !== where.card.isArchived) return false;
        if (where?.assessedAt?.not === null && row.assessedAt === null) return false;
        if (where?.assessedAt?.gte && !(row.assessedAt && row.assessedAt >= where.assessedAt.gte)) return false;
        if (where?.assessedAt?.lte && !(row.assessedAt && row.assessedAt <= where.assessedAt.lte)) return false;
        return true;
      });

      return rows.map((row) => {
        const next: Record<string, unknown> = {};
        for (const key of Object.keys(select)) {
          next[key] = row[key as keyof ReviewSessionCardRow];
        }
        return next;
      });
    },
  },
  cardTag: {
    findMany: async ({ where }: any) => {
      const allowedCardIds = new Set(where?.cardId?.in ?? []);
      return store.cardTags
        .filter((row) => allowedCardIds.has(row.cardId))
        .map((row) => ({
          cardId: row.cardId,
          tagId: row.tagId,
          tag: { name: store.tags.find((tag) => tag.id === row.tagId)?.name ?? 'unknown' },
        }));
    },
  },
};

vi.mock('../../backend/src/db/prisma.js', () => ({ prisma }));

describe('backend stats API', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-28T12:00:00.000Z'));
    store = makeStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns summary, trends, tag breakdown, and insights for 7d', async () => {
    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app).get('/api/stats?range=7d').expect(200);

    expect(res.body.selectedRange).toBe('7d');
    expect(res.body.summary.totalCardCount.value).toBe(3);
    expect(res.body.summary.completedReviewCount.value).toBe(4);
    expect(res.body.summary.completedReviewCount.deltaFromPrevious).toBe(2);
    expect(res.body.summary.averageAccuracy.value).toBe(75);
    expect(res.body.summary.streakDays.value).toBe(4);
    expect(res.body.summary.streakDays.bestRecordDays).toBe(4);
    expect(res.body.volumeTrend.bucketUnit).toBe('day');
    expect(res.body.tagBreakdown[0].tagName).toBe('文法');
    expect(res.body.tagBreakdown.find((item: { isWeakest: boolean }) => item.isWeakest)?.tagName).toBe('文法');
    expect(res.body.insights).toHaveLength(2);
    expect(res.body.state.mode).toBe('ready');
  });

  it('returns hourly buckets for today and monthly buckets for all', async () => {
    const { app } = await import('../../backend/src/index.ts');

    const todayRes = await request(app).get('/api/stats?range=today').expect(200);
    const allRes = await request(app).get('/api/stats?range=all').expect(200);

    expect(todayRes.body.volumeTrend.bucketUnit).toBe('hour');
    expect(todayRes.body.volumeTrend.points).toHaveLength(24);
    expect(allRes.body.volumeTrend.bucketUnit).toBe('month');
    expect(allRes.body.volumeTrend.points.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty state when the selected range has no review answers', async () => {
    const { app } = await import('../../backend/src/index.ts');
    vi.setSystemTime(new Date('2026-03-29T12:00:00.000Z'));

    const res = await request(app).get('/api/stats?range=today').expect(200);

    expect(res.body.state.mode).toBe('empty');
    expect(res.body.summary.completedReviewCount.value).toBe(0);
    expect(res.body.tagBreakdown).toEqual([]);
  });

  it('returns partial state when tag breakdown resolution fails', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const spy = vi.spyOn(prisma.cardTag, 'findMany').mockRejectedValueOnce(new Error('tag lookup failed'));

    const res = await request(app).get('/api/stats?range=7d').expect(200);

    expect(res.body.state.mode).toBe('partial');
    expect(res.body.state.unavailableSections).toEqual(expect.arrayContaining(['tagBreakdown', 'insights']));
    expect(res.body.tagBreakdown).toEqual([]);
    expect(res.body.insights).toEqual([]);

    spy.mockRestore();
  });

  it('returns 400 on invalid range', async () => {
    const { app } = await import('../../backend/src/index.ts');

    await request(app).get('/api/stats?range=bad').expect(400);
  });

  it('returns 503 on temporary repository failures', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const spy = vi.spyOn(prisma.card, 'count').mockRejectedValueOnce(new Error('db down'));

    await request(app).get('/api/stats?range=7d').expect(503);

    spy.mockRestore();
  });
});