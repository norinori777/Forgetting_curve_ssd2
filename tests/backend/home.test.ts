import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type CardRow = {
  id: string;
  proficiency: number;
  nextReviewAt: Date;
  isArchived: boolean;
  createdAt: Date;
};

type ReviewSessionRow = {
  id: string;
  status: string;
  totalCards: number;
  createdAt: Date;
  completedAt: Date | null;
};

type Store = {
  cards: CardRow[];
  reviewSessions: ReviewSessionRow[];
};

let store: Store;

function makeStore(): Store {
  return {
    cards: [
      {
        id: 'c-before-start',
        proficiency: 1,
        nextReviewAt: new Date('2026-03-25T23:59:59.999Z'),
        isArchived: false,
        createdAt: new Date('2026-03-20T09:00:00.000Z'),
      },
      {
        id: 'c-at-start',
        proficiency: 0,
        nextReviewAt: new Date('2026-03-26T00:00:00.000Z'),
        isArchived: false,
        createdAt: new Date('2026-03-24T08:00:00.000Z'),
      },
      {
        id: 'c-at-end',
        proficiency: 2,
        nextReviewAt: new Date('2026-03-26T23:59:59.999Z'),
        isArchived: false,
        createdAt: new Date('2026-03-26T11:00:00.000Z'),
      },
      {
        id: 'c-after-end',
        proficiency: 3,
        nextReviewAt: new Date('2026-03-27T00:00:00.000Z'),
        isArchived: false,
        createdAt: new Date('2026-03-21T10:00:00.000Z'),
      },
    ],
    reviewSessions: [
      {
        id: 'session-completed-today',
        status: 'completed',
        totalCards: 4,
        createdAt: new Date('2026-03-26T08:00:00.000Z'),
        completedAt: new Date('2026-03-26T08:30:00.000Z'),
      },
      {
        id: 'session-started-later',
        status: 'in_progress',
        totalCards: 2,
        createdAt: new Date('2026-03-26T10:00:00.000Z'),
        completedAt: null,
      },
      {
        id: 'session-completed-yesterday',
        status: 'completed',
        totalCards: 3,
        createdAt: new Date('2026-03-25T09:00:00.000Z'),
        completedAt: new Date('2026-03-25T09:30:00.000Z'),
      },
      {
        id: 'session-completed-old',
        status: 'completed',
        totalCards: 1,
        createdAt: new Date('2026-03-23T09:00:00.000Z'),
        completedAt: new Date('2026-03-23T09:30:00.000Z'),
      },
    ],
  };
}

function sortRows<T>(rows: T[], field: keyof T, dir: 'asc' | 'desc'): T[] {
  return [...rows].sort((left, right) => {
    const leftValue = left[field];
    const rightValue = right[field];
    const leftComparable = leftValue instanceof Date ? leftValue.getTime() : leftValue;
    const rightComparable = rightValue instanceof Date ? rightValue.getTime() : rightValue;

    if (leftComparable === rightComparable) return 0;
    if (dir === 'desc') return leftComparable > rightComparable ? -1 : 1;
    return leftComparable > rightComparable ? 1 : -1;
  });
}

const prisma = {
  card: {
    count: async ({ where }: any) => {
      return store.cards.filter((card) => {
        if (where?.isArchived !== undefined && card.isArchived !== where.isArchived) return false;
        if (where?.proficiency !== undefined && card.proficiency !== where.proficiency) return false;
        if (where?.nextReviewAt?.lte && !(card.nextReviewAt <= where.nextReviewAt.lte)) return false;
        if (where?.nextReviewAt?.lt && !(card.nextReviewAt < where.nextReviewAt.lt)) return false;
        return true;
      }).length;
    },
    findMany: async ({ where, orderBy, take, select }: any) => {
      let rows = store.cards.filter((card) => {
        if (where?.isArchived !== undefined && card.isArchived !== where.isArchived) return false;
        return true;
      });

      if (orderBy?.createdAt) {
        rows = sortRows(rows, 'createdAt', orderBy.createdAt);
      }

      return rows.slice(0, take ?? rows.length).map((row) => {
        if (!select) return row;
        const next: Record<string, unknown> = {};
        for (const key of Object.keys(select)) next[key] = row[key as keyof CardRow];
        return next;
      });
    },
  },
  reviewSession: {
    findMany: async ({ where, orderBy, take, select }: any) => {
      let rows = store.reviewSessions.filter((session) => {
        if (where?.status !== undefined && session.status !== where.status) return false;
        if (where?.completedAt?.not === null && session.completedAt === null) return false;
        return true;
      });

      if (orderBy?.createdAt) {
        rows = sortRows(rows, 'createdAt', orderBy.createdAt);
      }

      if (orderBy?.completedAt) {
        rows = sortRows(rows.filter((row) => row.completedAt !== null), 'completedAt', orderBy.completedAt) as ReviewSessionRow[];
      }

      return rows.slice(0, take ?? rows.length).map((row) => {
        if (!select) return row;
        const next: Record<string, unknown> = {};
        for (const key of Object.keys(select)) next[key] = row[key as keyof ReviewSessionRow];
        return next;
      });
    },
  },
};

vi.mock('../../backend/src/db/prisma.js', () => ({ prisma }));

describe('backend home API', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-26T12:00:00.000Z'));
    store = makeStore();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns summary counts with today and overdue boundaries plus streak days', async () => {
    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app).get('/api/home').expect(200);

    expect(res.body.summary).toEqual({
      todayDueCount: 3,
      overdueCount: 1,
      unlearnedCount: 1,
      streakDays: 2,
    });
    expect(res.body.state).toEqual({ firstUse: false, noReviewToday: false });
    expect(res.body).not.toHaveProperty('cards');
    expect(res.body.recentActivities).toHaveLength(3);
  });

  it('orders recent activities by occurredAt and limits to three items', async () => {
    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app).get('/api/home').expect(200);

    expect(res.body.recentActivities.map((item: { type: string }) => item.type)).toEqual([
      'card_created',
      'review_started',
      'review_completed',
    ]);
    expect(res.body.recentActivities[0].label).toBe('学習カードを追加');
  });

  it('returns first-use and no-review state when there are no active cards', async () => {
    const { app } = await import('../../backend/src/index.ts');
    store.cards = [];
    store.reviewSessions = [];

    const res = await request(app).get('/api/home').expect(200);

    expect(res.body.summary.todayDueCount).toBe(0);
    expect(res.body.recentActivities).toEqual([]);
    expect(res.body.state).toEqual({ firstUse: true, noReviewToday: true });
  });

  it('returns 503 on temporary repository failures', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const spy = vi.spyOn(prisma.card, 'count').mockRejectedValueOnce(new Error('db down'));

    await request(app).get('/api/home').expect(503);

    spy.mockRestore();
  });
});