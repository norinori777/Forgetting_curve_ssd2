import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let prisma: {
  tag: { findMany: (args: any) => Promise<Array<{ id: string; name: string }>> };
  collection: { findMany: (args: any) => Promise<Array<{ id: string; name: string }>> };
};

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  prisma = {
    tag: {
      findMany: async (args: any) => {
        const data = [
          { id: 'tag1', name: 'tag1' },
          { id: 'tag2', name: 'biology' },
        ];
        const q = args.where?.name?.contains?.toLowerCase?.() ?? '';
        return data.filter((item) => item.name.toLowerCase().includes(q)).slice(0, args.take ?? data.length);
      },
    },
    collection: {
      findMany: async (args: any) => {
        const data = [
          { id: 'col1', name: 'Inbox' },
          { id: 'col2', name: 'Daily Review' },
        ];
        const q = args.where?.name?.contains?.toLowerCase?.() ?? '';
        return data.filter((item) => item.name.toLowerCase().includes(q)).slice(0, args.take ?? data.length);
      },
    },
  };
});

vi.mock('../../backend/src/db/prisma.js', () => ({
  get prisma() {
    return prisma;
  },
}));

describe('filter options endpoints', () => {
  it('returns tag options for search text', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const res = await request(app).get('/api/tags?q=tag').expect(200);

    expect(res.body.items).toEqual([{ id: 'tag1', label: 'tag1', matchedBy: 'name' }]);
  });

  it('returns collection options for search text', async () => {
    const { app } = await import('../../backend/src/index.ts');
    const res = await request(app).get('/api/collections?q=daily').expect(200);

    expect(res.body.items).toEqual([{ id: 'col2', label: 'Daily Review', matchedBy: 'name' }]);
  });
});