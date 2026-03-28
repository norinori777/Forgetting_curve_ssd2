import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type CollectionRow = {
  id: string;
  name: string;
  normalizedName: string;
  description: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

type CardRow = {
  id: string;
  collectionId: string | null;
};

type Store = {
  collections: CollectionRow[];
  cards: CardRow[];
};

const ownerId = '00000000-0000-0000-0000-000000000001';

let store: Store;

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase('ja-JP');
}

function buildCollection(overrides: Partial<CollectionRow>): CollectionRow {
  const name = overrides.name ?? 'Collection';
  const now = overrides.updatedAt ?? new Date('2026-03-28T09:00:00.000Z');

  return {
    id: overrides.id ?? '00000000-0000-0000-0000-000000000101',
    name,
    normalizedName: overrides.normalizedName ?? normalizeName(name),
    description: overrides.description ?? '',
    ownerId: overrides.ownerId ?? ownerId,
    createdAt: overrides.createdAt ?? now,
    updatedAt: now,
  };
}

function buildManagedCollectionRow(collection: CollectionRow) {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    updatedAt: collection.updatedAt,
    _count: {
      cards: store.cards.filter((card) => card.collectionId === collection.id).length,
    },
  };
}

const prisma = {
  collection: {
    findMany: async (args: any) => {
      if (args.where?.name?.contains) {
        const needle = String(args.where.name.contains).toLowerCase();
        return store.collections
          .filter((collection) => collection.name.toLowerCase().includes(needle))
          .slice(0, args.take ?? store.collections.length)
          .map((collection) => ({ id: collection.id, name: collection.name }));
      }

      const rows = store.collections
        .filter((collection) => collection.ownerId === args.where?.ownerId)
        .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());

      return rows.map(buildManagedCollectionRow);
    },
    findFirst: async (args: any) => {
      const row = store.collections.find(
        (collection) => collection.id === args.where?.id && collection.ownerId === args.where?.ownerId,
      );

      if (!row) {
        return null;
      }

      if (args.select?._count) {
        return {
          id: row.id,
          _count: {
            cards: store.cards.filter((card) => card.collectionId === row.id).length,
          },
        };
      }

      return { id: row.id };
    },
    create: async (args: any) => {
      const duplicate = store.collections.find(
        (collection) =>
          collection.ownerId === args.data.ownerId && collection.normalizedName === args.data.normalizedName,
      );

      if (duplicate) {
        throw { code: 'P2002' };
      }

      const created = buildCollection({
        id: `collection-${store.collections.length + 1}`,
        name: args.data.name,
        normalizedName: args.data.normalizedName,
        description: args.data.description,
        ownerId: args.data.ownerId,
        createdAt: new Date('2026-03-28T10:00:00.000Z'),
        updatedAt: new Date('2026-03-28T10:00:00.000Z'),
      });

      store.collections.push(created);
      return buildManagedCollectionRow(created);
    },
    update: async (args: any) => {
      const target = store.collections.find((collection) => collection.id === args.where?.id);

      if (!target) {
        throw new Error('not_found');
      }

      const duplicate = store.collections.find(
        (collection) =>
          collection.id !== target.id
          && collection.ownerId === target.ownerId
          && collection.normalizedName === args.data.normalizedName,
      );

      if (duplicate) {
        throw { code: 'P2002' };
      }

      target.name = args.data.name;
      target.normalizedName = args.data.normalizedName;
      target.description = args.data.description;
      target.updatedAt = new Date('2026-03-28T11:00:00.000Z');
      return buildManagedCollectionRow(target);
    },
    delete: async (args: any) => {
      store.collections = store.collections.filter((collection) => collection.id !== args.where?.id);
      return { id: args.where?.id };
    },
  },
};

vi.mock('../../backend/src/db/prisma.js', () => ({ prisma }));

describe('backend collections management API', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    delete process.env.COLLECTION_OWNER_ID;

    store = {
      collections: [
        buildCollection({ id: '00000000-0000-0000-0000-000000000111', name: '空のコレクション', description: '削除可能', updatedAt: new Date('2026-03-28T08:00:00.000Z') }),
        buildCollection({ id: '00000000-0000-0000-0000-000000000112', name: '利用中コレクション', description: '削除不可', updatedAt: new Date('2026-03-28T09:00:00.000Z') }),
      ],
      cards: [{ id: 'card-1', collectionId: '00000000-0000-0000-0000-000000000112' }],
    };
  });

  it('lists managed collections with delete metadata', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const response = await request(app).get('/api/collections/manage').expect(200);

    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0]).toMatchObject({
      id: '00000000-0000-0000-0000-000000000112',
      name: '利用中コレクション',
      cardCount: 1,
      canDelete: false,
      deleteBlockedReason: 'カードが残っているため削除できません。',
    });
  });

  it('creates a managed collection and trims the optional description', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const response = await request(app)
      .post('/api/collections/manage')
      .send({ name: '  新しいコレクション  ', description: '  補足メモ  ' })
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.collection).toMatchObject({
      name: '新しいコレクション',
      description: '補足メモ',
      canDelete: true,
    });
  });

  it('returns invalid_body for an empty name', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const response = await request(app)
      .post('/api/collections/manage')
      .send({ name: '   ', description: null })
      .expect(400);

    expect(response.body.error).toBe('invalid_body');
  });

  it('rejects duplicate names normalized by owner scope', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const response = await request(app)
      .post('/api/collections/manage')
      .send({ name: '  利用中コレクション ', description: null })
      .expect(400);

    expect(response.body).toMatchObject({ error: 'duplicate_name', message: 'duplicate_name' });
  });

  it('updates an existing collection', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const response = await request(app)
      .patch('/api/collections/manage/00000000-0000-0000-0000-000000000111')
      .send({ name: '更新後コレクション', description: '更新メモ' })
      .expect(200);

    expect(response.body.collection).toMatchObject({
      id: '00000000-0000-0000-0000-000000000111',
      name: '更新後コレクション',
      description: '更新メモ',
    });
  });

  it('deletes an empty collection', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const response = await request(app).delete('/api/collections/manage/00000000-0000-0000-0000-000000000111').expect(200);

    expect(response.body).toEqual({ ok: true, deletedId: '00000000-0000-0000-0000-000000000111' });
    expect(store.collections.some((collection) => collection.id === '00000000-0000-0000-0000-000000000111')).toBe(false);
  });

  it('blocks delete when cards still use the collection', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const response = await request(app).delete('/api/collections/manage/00000000-0000-0000-0000-000000000112').expect(409);

    expect(response.body).toMatchObject({ error: 'collection_in_use', message: 'collection_in_use' });
  });
});