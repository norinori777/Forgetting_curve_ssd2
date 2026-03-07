import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type CardRow = {
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
};

type TagRow = { id: string; name: string };

type CardTagRow = { cardId: string; tagId: string };

type Store = {
  cards: CardRow[];
  tags: TagRow[];
  cardTags: CardTagRow[];
};

let store: Store;

function makeStore(): Store {
  return { cards: [], tags: [], cardTags: [] };
}

function compareAsc(a: any, b: any): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function matchScalar(value: any, condition: any): boolean {
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    if (condition.contains !== undefined) {
      const needle = String(condition.contains);
      const hay = String(value);
      return condition.mode === 'insensitive'
        ? hay.toLowerCase().includes(needle.toLowerCase())
        : hay.includes(needle);
    }
    if (condition.in) return (condition.in as any[]).includes(value);
    if (condition.gt !== undefined) return value > condition.gt;
    if (condition.gte !== undefined) return value >= condition.gte;
    if (condition.lt !== undefined) return value < condition.lt;
    if (condition.lte !== undefined) return value <= condition.lte;
    return false;
  }
  return value === condition;
}

function matchDate(value: Date, condition: any): boolean {
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    if (condition.gt !== undefined) return value.getTime() > (condition.gt as Date).getTime();
    if (condition.gte !== undefined) return value.getTime() >= (condition.gte as Date).getTime();
    if (condition.lt !== undefined) return value.getTime() < (condition.lt as Date).getTime();
    if (condition.lte !== undefined) return value.getTime() <= (condition.lte as Date).getTime();
    return false;
  }
  if (condition instanceof Date) return value.getTime() === condition.getTime();
  return false;
}

function matchWhere(card: CardRow, where: any): boolean {
  if (!where) return true;

  if (where.AND) {
    return (where.AND as any[]).every((w) => matchWhere(card, w));
  }

  if (where.OR) {
    return (where.OR as any[]).some((w) => matchWhere(card, w));
  }

  for (const [key, cond] of Object.entries(where)) {
    if (key === 'id') {
      if (!matchScalar(card.id, cond)) return false;
      continue;
    }
    if (key === 'title') {
      if (!matchScalar(card.title, cond)) return false;
      continue;
    }
    if (key === 'content') {
      if (!matchScalar(card.content, cond)) return false;
      continue;
    }
    if (key === 'collectionId') {
      if (!matchScalar(card.collectionId, cond)) return false;
      continue;
    }
    if (key === 'isArchived') {
      if (!matchScalar(card.isArchived, cond)) return false;
      continue;
    }
    if (key === 'proficiency') {
      if (!matchScalar(card.proficiency, cond)) return false;
      continue;
    }
    if (key === 'nextReviewAt') {
      if (!matchDate(card.nextReviewAt, cond)) return false;
      continue;
    }
    if (key === 'createdAt') {
      if (!matchDate(card.createdAt, cond)) return false;
      continue;
    }

    if (key === 'tags') {
      const some = (cond as any).some;
      if (!some) return false;

      const tagRows = store.cardTags
        .filter((ct) => ct.cardId === card.id)
        .map((ct) => ({
          tagId: ct.tagId,
          tag: store.tags.find((t) => t.id === ct.tagId),
        }));

      const ok = tagRows.some((row) => {
        if (some.OR) {
          return (some.OR as any[]).some((orCond) => {
            if (orCond.tagId) {
              return matchScalar(row.tagId, orCond.tagId);
            }
            if (orCond.tag?.name) {
              return matchScalar(row.tag?.name, orCond.tag.name);
            }
            return false;
          });
        }
        return false;
      });

      if (!ok) return false;
      continue;
    }

    return false;
  }

  return true;
}

function createFakePrisma(getStore: () => Store) {
  return {
    card: {
      findMany: async (args: any) => {
        const s = getStore();
        let rows = s.cards.filter((c) => matchWhere(c, args.where));

        const orderBys = args.orderBy ?? [];
        rows = rows.sort((a: any, b: any) => {
          for (const order of orderBys) {
            const [[field, dir]] = Object.entries(order);
            const av = a[field];
            const bv = b[field];
            const aValue = av instanceof Date ? av.getTime() : av;
            const bValue = bv instanceof Date ? bv.getTime() : bv;
            const base = compareAsc(aValue, bValue);
            if (base !== 0) return dir === 'desc' ? -base : base;
          }
          return 0;
        });

        rows = rows.slice(0, args.take ?? rows.length);

        return rows.map((c) => ({
          ...c,
          tags: s.cardTags
            .filter((ct) => ct.cardId === c.id)
            .map((ct) => ({
              tagId: ct.tagId,
              tag: s.tags.find((t) => t.id === ct.tagId),
            })),
        }));
      },
      updateMany: async (args: any) => {
        const s = getStore();
        const ids = args.where?.id?.in ?? [];
        let count = 0;
        for (const c of s.cards) {
          if (ids.includes(c.id)) {
            Object.assign(c, args.data);
            count += 1;
          }
        }
        return { count };
      },
      deleteMany: async (args: any) => {
        const s = getStore();
        const ids = args.where?.id?.in ?? [];
        const before = s.cards.length;
        s.cards = s.cards.filter((c) => !ids.includes(c.id));
        s.cardTags = s.cardTags.filter((ct) => !ids.includes(ct.cardId));
        return { count: before - s.cards.length };
      },
    },
    tag: {
      upsert: async (args: any) => {
        const s = getStore();
        const existing = s.tags.find((t) => t.name === args.where.name);
        if (existing) return existing;
        const created = { id: `tag_${s.tags.length + 1}`, name: args.create.name };
        s.tags.push(created);
        return created;
      },
      findMany: async (args: any) => {
        const s = getStore();
        const names = args.where?.OR?.[0]?.name?.in ?? [];
        const ids = args.where?.OR?.[1]?.id?.in ?? [];
        return s.tags.filter((t) => names.includes(t.name) || ids.includes(t.id));
      },
    },
    cardTag: {
      createMany: async (args: any) => {
        const s = getStore();
        for (const row of args.data as CardTagRow[]) {
          const exists = s.cardTags.some((ct) => ct.cardId === row.cardId && ct.tagId === row.tagId);
          if (!exists) s.cardTags.push(row);
        }
        return { count: args.data.length };
      },
      deleteMany: async (args: any) => {
        const s = getStore();
        const cardIds = args.where?.cardId?.in ?? [];
        const tagIds = args.where?.tagId?.in ?? [];
        const before = s.cardTags.length;
        s.cardTags = s.cardTags.filter((ct) => !(cardIds.includes(ct.cardId) && tagIds.includes(ct.tagId)));
        return { count: before - s.cardTags.length };
      },
    },
  };
}

const prisma = createFakePrisma(() => store);

vi.mock('../../backend/src/db/prisma.js', () => ({ prisma }));

describe('backend cards API', () => {
  beforeEach(() => {
    store = makeStore();
  });

  it('paginates with nextCursor', async () => {
    const { listCards } = await import('../../backend/src/repositories/cardRepository.ts');

    store.cards = [
      {
        id: 'c1',
        title: 'A',
        content: 'first',
        collectionId: null,
        proficiency: 1,
        nextReviewAt: new Date('2026-03-07T00:00:00.000Z'),
        lastCorrectRate: 0.1,
        isArchived: false,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
      {
        id: 'c2',
        title: 'B',
        content: 'second',
        collectionId: null,
        proficiency: 2,
        nextReviewAt: new Date('2026-03-07T00:00:01.000Z'),
        lastCorrectRate: 0.2,
        isArchived: false,
        createdAt: new Date('2026-03-02T00:00:00.000Z'),
        updatedAt: new Date('2026-03-02T00:00:00.000Z'),
      },
      {
        id: 'c3',
        title: 'C',
        content: 'third',
        collectionId: null,
        proficiency: 3,
        nextReviewAt: new Date('2026-03-07T00:00:02.000Z'),
        lastCorrectRate: 0.3,
        isArchived: false,
        createdAt: new Date('2026-03-03T00:00:00.000Z'),
        updatedAt: new Date('2026-03-03T00:00:00.000Z'),
      },
    ];

    const page1 = await listCards({
      cursor: undefined,
      limit: 2,
      q: undefined,
      tags: undefined,
      collection: undefined,
      filter: undefined,
      sort: 'next_review_at',
    });

    expect(page1.items.map((i) => i.id)).toEqual(['c1', 'c2']);
    expect(page1.nextCursor).toBeTruthy();

    const page2 = await listCards({
      cursor: page1.nextCursor,
      limit: 2,
      q: undefined,
      tags: undefined,
      collection: undefined,
      filter: undefined,
      sort: 'next_review_at',
    });

    expect(page2.items.map((i) => i.id)).toEqual(['c3']);
  });

  it('filters today with boundary values', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00.000Z'));

    const { listCards } = await import('../../backend/src/repositories/cardRepository.ts');

    store.cards = [
      {
        id: 'c_today_start',
        title: 'today-start',
        content: 'x',
        collectionId: null,
        proficiency: 1,
        nextReviewAt: new Date('2026-03-07T00:00:00.000Z'),
        lastCorrectRate: 0.1,
        isArchived: false,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
      {
        id: 'c_today_end',
        title: 'today-end',
        content: 'y',
        collectionId: null,
        proficiency: 2,
        nextReviewAt: new Date('2026-03-07T23:59:59.999Z'),
        lastCorrectRate: 0.2,
        isArchived: false,
        createdAt: new Date('2026-03-02T00:00:00.000Z'),
        updatedAt: new Date('2026-03-02T00:00:00.000Z'),
      },
      {
        id: 'c_before',
        title: 'before',
        content: 'z',
        collectionId: null,
        proficiency: 3,
        nextReviewAt: new Date('2026-03-06T23:59:59.999Z'),
        lastCorrectRate: 0.3,
        isArchived: false,
        createdAt: new Date('2026-03-03T00:00:00.000Z'),
        updatedAt: new Date('2026-03-03T00:00:00.000Z'),
      },
    ];

    const result = await listCards({
      cursor: undefined,
      limit: 50,
      q: undefined,
      tags: undefined,
      collection: undefined,
      filter: 'today',
      sort: 'next_review_at',
    });

    expect(result.items.map((i) => i.id)).toEqual([
      'c_before',
      'c_today_start',
      'c_today_end',
    ]);

    vi.useRealTimers();
  });

  it('bulk delete endpoint deletes selected cards', async () => {
    process.env.NODE_ENV = 'test';

    store.cards = [
      {
        id: 'c1',
        title: 'A',
        content: 'first',
        collectionId: null,
        proficiency: 1,
        nextReviewAt: new Date('2026-03-07T00:00:00.000Z'),
        lastCorrectRate: 0.1,
        isArchived: false,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
      {
        id: 'c2',
        title: 'B',
        content: 'second',
        collectionId: null,
        proficiency: 2,
        nextReviewAt: new Date('2026-03-07T00:00:01.000Z'),
        lastCorrectRate: 0.2,
        isArchived: false,
        createdAt: new Date('2026-03-02T00:00:00.000Z'),
        updatedAt: new Date('2026-03-02T00:00:00.000Z'),
      },
      {
        id: 'c3',
        title: 'C',
        content: 'third',
        collectionId: null,
        proficiency: 3,
        nextReviewAt: new Date('2026-03-07T00:00:02.000Z'),
        lastCorrectRate: 0.3,
        isArchived: false,
        createdAt: new Date('2026-03-03T00:00:00.000Z'),
        updatedAt: new Date('2026-03-03T00:00:00.000Z'),
      },
    ];

    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .post('/api/cards/bulk')
      .send({ action: 'delete', cardIds: ['c1', 'c3'] })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.deleted).toBe(2);
    expect(store.cards.map((c) => c.id)).toEqual(['c2']);
  });
});
