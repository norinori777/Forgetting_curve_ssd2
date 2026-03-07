import type { Prisma } from '@prisma/client';

import { prisma } from '../db/prisma.js';
import type { CardSortKey, CursorPayload, ListCardsQuery } from '../schemas/cards.js';
import { decodeCursor, encodeCursor } from '../schemas/cards.js';
import { buildCardBaseFilters } from '../services/searchService.js';

export type ApiCard = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  collectionId: string | null;
  proficiency: number;
  nextReviewAt: string;
  lastCorrectRate: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

function buildCursorWhere(sort: CardSortKey, cursor: CursorPayload): Prisma.CardWhereInput {
  if (cursor.sort !== sort) {
    throw new Error('Cursor sort does not match requested sort');
  }

  const field: 'nextReviewAt' | 'createdAt' | 'proficiency' =
    sort === 'next_review_at' ? 'nextReviewAt' : sort === 'created_at' ? 'createdAt' : 'proficiency';

  if (sort === 'proficiency') {
    const value = cursor.value;
    return {
      OR: [
        { [field]: { gt: value } },
        { [field]: value, id: { gt: cursor.id } },
      ],
    };
  }

  const value = new Date(cursor.value);
  return {
    OR: [
      { [field]: { gt: value } },
      { [field]: value, id: { gt: cursor.id } },
    ],
  };
}

function buildOrderBy(sort: CardSortKey): Prisma.CardOrderByWithRelationInput[] {
  if (sort === 'created_at') return [{ createdAt: 'asc' }, { id: 'asc' }];
  if (sort === 'proficiency') return [{ proficiency: 'asc' }, { id: 'asc' }];
  return [{ nextReviewAt: 'asc' }, { id: 'asc' }];
}

function toApiCard(card: any): ApiCard {
  return {
    id: card.id,
    title: card.title,
    content: card.content,
    tags: (card.tags ?? []).map((ct: any) => ct.tag?.name).filter(Boolean),
    collectionId: card.collectionId,
    proficiency: card.proficiency,
    nextReviewAt: card.nextReviewAt.toISOString(),
    lastCorrectRate: card.lastCorrectRate,
    isArchived: card.isArchived,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

export async function listCards(query: ListCardsQuery): Promise<{ items: ApiCard[]; nextCursor?: string }> {
  const and: Prisma.CardWhereInput[] = buildCardBaseFilters(query);

  if (query.cursor) {
    const payload = decodeCursor(query.cursor);
    and.push(buildCursorWhere(query.sort, payload));
  }

  const where: Prisma.CardWhereInput = { AND: and };

  const take = query.limit;
  const orderBy = buildOrderBy(query.sort);

  const rows = await prisma.card.findMany({
    where,
    orderBy,
    take,
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  const items = rows.map(toApiCard);
  const last = rows.at(-1);
  const nextCursor = last
    ? encodeCursor(
        query.sort === 'proficiency'
          ? { sort: 'proficiency', value: last.proficiency, id: last.id }
          : query.sort === 'created_at'
            ? { sort: 'created_at', value: last.createdAt.toISOString(), id: last.id }
            : { sort: 'next_review_at', value: last.nextReviewAt.toISOString(), id: last.id },
      )
    : undefined;

  return { items, nextCursor };
}

export async function archiveCards(cardIds: string[]): Promise<number> {
  const result = await prisma.card.updateMany({
    where: { id: { in: cardIds } },
    data: { isArchived: true },
  });
  return result.count;
}

export async function deleteCards(cardIds: string[]): Promise<number> {
  const result = await prisma.card.deleteMany({
    where: { id: { in: cardIds } },
  });
  return result.count;
}

export async function addTagsToCards(cardIds: string[], tags: string[]): Promise<void> {
  const tagRows = await Promise.all(
    tags.map((name) => prisma.tag.upsert({ where: { name }, update: {}, create: { name } })),
  );

  const tagIds = tagRows.map((t) => t.id);
  const data = cardIds.flatMap((cardId) => tagIds.map((tagId) => ({ cardId, tagId })));

  if (data.length === 0) return;

  await prisma.cardTag.createMany({ data, skipDuplicates: true });
}

export async function removeTagsFromCards(cardIds: string[], tags: string[]): Promise<number> {
  const tagRows = await prisma.tag.findMany({
    where: {
      OR: [{ name: { in: tags } }, { id: { in: tags } }],
    },
    select: { id: true },
  });

  const tagIds = tagRows.map((t) => t.id);
  if (tagIds.length === 0) return 0;

  const result = await prisma.cardTag.deleteMany({
    where: {
      cardId: { in: cardIds },
      tagId: { in: tagIds },
    },
  });

  return result.count;
}

export async function getCardsByIds(cardIds: string[]): Promise<ApiCard[]> {
  const rows = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    include: {
      tags: { include: { tag: true } },
    },
  });

  return rows.map(toApiCard);
}
