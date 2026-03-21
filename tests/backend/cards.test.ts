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

type CollectionRow = { id: string; name: string; ownerId: string };

type Store = {
  cards: CardRow[];
  tags: TagRow[];
  collections: CollectionRow[];
  cardTags: CardTagRow[];
};

let store: Store;

function makeStore(): Store {
  return { cards: [], tags: [], collections: [], cardTags: [] };
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
  const tx = {
    collection: {
      findUnique: async (args: any) => {
        const s = getStore();
        return s.collections.find((collection) => collection.id === args.where?.id) ?? null;
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
    },
    card: {
      create: async (args: any) => {
        const s = getStore();
        const createdAt = new Date();
        const created: CardRow = {
          id: `card_${s.cards.length + 1}`,
          title: args.data.title,
          content: args.data.content,
          collectionId: args.data.collectionId ?? null,
          proficiency: args.data.proficiency,
          nextReviewAt: args.data.nextReviewAt,
          lastCorrectRate: args.data.lastCorrectRate,
          isArchived: args.data.isArchived,
          createdAt,
          updatedAt: createdAt,
        };
        s.cards.push(created);
        return created;
      },
    },
  };

  return {
    $transaction: async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
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
        if (args.where?.name?.contains) {
          const needle = String(args.where.name.contains).toLowerCase();
          return s.tags.filter((t) => t.name.toLowerCase().includes(needle)).slice(0, args.take ?? s.tags.length);
        }
        const names = (args.where?.OR ?? []).flatMap((entry: any) => entry.name?.in ?? []);
        const ids = (args.where?.OR ?? []).flatMap((entry: any) => entry.id?.in ?? []);
        return s.tags.filter((t) => names.includes(t.name) || ids.includes(t.id));
      },
    },
    collection: {
      findMany: async (args: any) => {
        const s = getStore();
        if (args.where?.name?.contains) {
          const needle = String(args.where.name.contains).toLowerCase();
          return s.collections
            .filter((c) => c.name.toLowerCase().includes(needle))
            .slice(0, args.take ?? s.collections.length);
        }
        return s.collections.slice(0, args.take ?? s.collections.length);
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
      tagIds: undefined,
      collectionIds: undefined,
      filter: undefined,
      sort: 'next_review_at',
    });

    expect(page1.items.map((i) => i.id)).toEqual(['c1', 'c2']);
    expect(page1.nextCursor).toBeTruthy();

    const page2 = await listCards({
      cursor: page1.nextCursor,
      limit: 2,
      q: undefined,
      tagIds: undefined,
      collectionIds: undefined,
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
      tagIds: undefined,
      collectionIds: undefined,
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

  it('filters cards by tagIds', async () => {
    const { listCards } = await import('../../backend/src/repositories/cardRepository.ts');

    store.cards = [
      {
        id: 'c1',
        title: 'Tagged',
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
        title: 'Untagged',
        content: 'second',
        collectionId: null,
        proficiency: 2,
        nextReviewAt: new Date('2026-03-08T00:00:00.000Z'),
        lastCorrectRate: 0.2,
        isArchived: false,
        createdAt: new Date('2026-03-02T00:00:00.000Z'),
        updatedAt: new Date('2026-03-02T00:00:00.000Z'),
      },
    ];
    store.tags = [{ id: 'tag1', name: 'tag1' }];
    store.cardTags = [{ cardId: 'c1', tagId: 'tag1' }];

    const result = await listCards({
      cursor: undefined,
      limit: 50,
      q: undefined,
      tagIds: ['tag1'],
      collectionIds: undefined,
      filter: undefined,
      sort: 'next_review_at',
    });

    expect(result.items.map((item) => item.id)).toEqual(['c1']);
  });

  it('parses list query params for filter, collectionIds, tagIds, and sort', async () => {
    process.env.NODE_ENV = 'test';

    store.cards = [
      {
        id: 'c1',
        title: 'Tagged in collection',
        content: 'first',
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
        title: 'Different collection',
        content: 'second',
        collectionId: 'col2',
        proficiency: 0,
        nextReviewAt: new Date('2026-03-07T00:00:00.000Z'),
        lastCorrectRate: 0.2,
        isArchived: false,
        createdAt: new Date('2026-03-02T00:00:00.000Z'),
        updatedAt: new Date('2026-03-02T00:00:00.000Z'),
      },
    ];
    store.tags = [{ id: 'tag1', name: 'tag1' }];
    store.cardTags = [{ cardId: 'c1', tagId: 'tag1' }];

    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .get('/api/cards?filter=unlearned&tagIds=tag1&collectionIds=col1&sort=created_at')
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe('c1');
  });

  it('bulk archive endpoint marks selected cards as archived', async () => {
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
    ];

    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .post('/api/cards/bulk')
      .send({ action: 'archive', cardIds: ['c1'] })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.archived).toBe(1);
    expect(store.cards.find((card) => card.id === 'c1')?.isArchived).toBe(true);
    expect(store.cards.find((card) => card.id === 'c2')?.isArchived).toBe(false);
  });

  it('bulk tag endpoints are idempotent for repeated add and remove requests', async () => {
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
    ];
    store.tags = [{ id: 'tag1', name: 'tag1' }];

    const { app } = await import('../../backend/src/index.ts');

    await request(app)
      .post('/api/cards/bulk')
      .send({ action: 'addTags', cardIds: ['c1'], tagIds: ['tag1'] })
      .expect(200);

    await request(app)
      .post('/api/cards/bulk')
      .send({ action: 'addTags', cardIds: ['c1'], tagIds: ['tag1'] })
      .expect(200);

    expect(store.cardTags).toEqual([{ cardId: 'c1', tagId: 'tag1' }]);

    const removeFirst = await request(app)
      .post('/api/cards/bulk')
      .send({ action: 'removeTags', cardIds: ['c1'], tagIds: ['tag1'] })
      .expect(200);

    const removeSecond = await request(app)
      .post('/api/cards/bulk')
      .send({ action: 'removeTags', cardIds: ['c1'], tagIds: ['tag1'] })
      .expect(200);

    expect(removeFirst.body.ok).toBe(true);
    expect(removeFirst.body.removed).toBe(1);
    expect(removeSecond.body.ok).toBe(true);
    expect(removeSecond.body.removed).toBe(0);
    expect(store.cardTags).toEqual([]);
  });

  it('rejects tag bulk actions when tagIds are omitted', async () => {
    process.env.NODE_ENV = 'test';

    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .post('/api/cards/bulk')
      .send({ action: 'addTags', cardIds: ['c1'] })
      .expect(400);

    expect(res.body.error).toBe('invalid_body');
  });

  it('creates a card and auto-creates missing tags', async () => {
    process.env.NODE_ENV = 'test';

    const collectionId = '11111111-1111-1111-1111-111111111111';
    store.collections = [{ id: collectionId, name: 'TOEIC 600', ownerId: 'owner1' }];

    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .post('/api/cards')
      .send({
        title: '英単語セットA',
        content: 'photosynthesis = 光合成',
        tagNames: ['英語', '基礎'],
        collectionId,
      })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.card.title).toBe('英単語セットA');
    expect(res.body.card.tags).toEqual(['英語', '基礎']);
    expect(res.body.card.collectionId).toBe(collectionId);
    expect(store.cards).toHaveLength(1);
    expect(store.tags.map((tag) => tag.name)).toEqual(['英語', '基礎']);
    expect(store.cardTags).toHaveLength(2);
  });

  it('rejects create requests with invalid body', async () => {
    process.env.NODE_ENV = 'test';

    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .post('/api/cards')
      .send({ title: '   ', content: '' })
      .expect(400);

    expect(res.body.error).toBe('invalid_body');
    expect(res.body.details.fieldErrors.title).toBeTruthy();
    expect(res.body.details.fieldErrors.content).toBeTruthy();
  });

  it('rejects create requests for unknown collections', async () => {
    process.env.NODE_ENV = 'test';

    const { app } = await import('../../backend/src/index.ts');

    const res = await request(app)
      .post('/api/cards')
      .send({
        title: '英単語セットA',
        content: 'photosynthesis = 光合成',
        tagNames: ['英語'],
        collectionId: '22222222-2222-2222-2222-222222222222',
      })
      .expect(400);

    expect(res.body.error).toBe('bad_request');
    expect(res.body.message).toBe('collection_not_found');
  });

  it('emits structured create-card failure logs without PII', async () => {
    process.env.NODE_ENV = 'development';

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { app } = await import('../../backend/src/index.ts');

    await request(app)
      .post('/api/cards')
      .send({
        title: '英単語セットA',
        content: 'photosynthesis = 光合成',
        tagNames: ['英語'],
        collectionId: '33333333-3333-3333-3333-333333333333',
      })
      .expect(400);

    const payloads = errorSpy.mock.calls.map(([message]) => String(message));

    expect(payloads.length).toBeGreaterThan(0);
    expect(payloads.some((payload) => JSON.parse(payload).scope === 'cardRepository')).toBe(true);
    expect(payloads.some((payload) => JSON.parse(payload).scope === 'cardsApi')).toBe(true);
    expect(payloads.every((payload) => !payload.includes('英単語セットA'))).toBe(true);
    expect(payloads.every((payload) => !payload.includes('photosynthesis = 光合成'))).toBe(true);

    errorSpy.mockRestore();
    process.env.NODE_ENV = 'test';
  });
});
