import type { Prisma } from '@prisma/client';

import { prisma } from '../db/prisma.js';
import type { FilterOption } from '../domain/cardList.js';
import { normalizeCollectionName } from './collectionRepository.js';
import type { CardImportRow, CardSortKey, CreateCardBody, CursorPayload, ListCardsQuery } from '../schemas/cards.js';
import { decodeCursor, encodeCursor } from '../schemas/cards.js';
import { buildCardBaseFilters } from '../services/searchService.js';
import type { CardListFilter } from '../domain/cardList.js';
import type { ReviewTargetExclusion, ReviewTargetResolution } from '../domain/review.js';

export const REVIEW_START_LIMIT = 200;

export type ResolvedReviewTargetSet = {
  cardIds: string[];
  targetResolution: ReviewTargetResolution;
};

export type ApiCard = {
  id: string;
  title: string;
  content: string;
  answer: string | null;
  tags: string[];
  collectionId: string | null;
  proficiency: number;
  nextReviewAt: string;
  lastCorrectRate: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

type CardWithTags = Prisma.CardGetPayload<{
  include: {
    tags: {
      include: { tag: true };
    };
  };
}>;

export class CreateCardRepositoryError extends Error {
  constructor(
    public readonly code: 'COLLECTION_NOT_FOUND' | 'DATABASE_ERROR',
    message: string,
  ) {
    super(message);
  }
}

export type CardImportIssueCode = 'title_required' | 'content_required' | 'collection_not_found';

export type CardImportIssue = {
  scope: 'row';
  rowNumber: number;
  code: CardImportIssueCode;
  messageKey: string;
  messageText: string;
  detail: string | null;
};

export type CardImportValidationRow = {
  rowNumber: number;
  title: string;
  content: string;
  answer: string | null;
  tagNames: string[];
  collectionName: string | null;
  resolvedCollectionId: string | null;
  status: 'valid' | 'invalid';
  issues: CardImportIssue[];
};

export type CardImportSummary = {
  totalRows: number;
  headerSkipped: boolean;
  validRows: number;
  invalidRows: number;
  canImport: boolean;
  importedRows: number | null;
};

export type CardImportValidationResult = {
  summary: CardImportSummary;
  rows: CardImportValidationRow[];
  issues: CardImportIssue[];
};

export class CardImportRepositoryError extends Error {
  constructor(
    public readonly code: 'VALIDATION_FAILED' | 'DATABASE_ERROR',
    message: string,
    public readonly details?: CardImportValidationResult,
  ) {
    super(message);
  }
}

function logRepositoryEvent(level: 'info' | 'error', event: string, metadata: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'test') return;

  const payload = JSON.stringify({
    scope: 'cardRepository',
    event,
    ...metadata,
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.info(payload);
}

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

function buildTargetResolution(matchedCount: number, includedCount: number, unavailableCount: number): ReviewTargetResolution {
  const overLimitCount = Math.max(matchedCount - unavailableCount - includedCount, 0);
  const exclusionBreakdown: ReviewTargetExclusion[] = [];

  if (overLimitCount > 0) exclusionBreakdown.push({ reason: 'over_limit', count: overLimitCount });
  if (unavailableCount > 0) exclusionBreakdown.push({ reason: 'unavailable', count: unavailableCount });

  return {
    matchedCount,
    includedCount,
    excludedCount: overLimitCount + unavailableCount,
    exclusionBreakdown,
  };
}

function toApiCard(card: CardWithTags): ApiCard {
  return {
    id: card.id,
    title: card.title,
    content: card.content,
    answer: card.answer ?? null,
    tags: (card.tags ?? []).map((ct) => ct.tag?.name).filter((t): t is string => typeof t === 'string'),
    collectionId: card.collectionId,
    proficiency: card.proficiency,
    nextReviewAt: card.nextReviewAt.toISOString(),
    lastCorrectRate: card.lastCorrectRate,
    isArchived: card.isArchived,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

function createCardImportIssue(rowNumber: number, code: CardImportIssueCode, detail: string | null = null): CardImportIssue {
  const message =
    code === 'title_required'
      ? { key: 'cardCsvImport.validation.titleRequired', text: 'タイトルは必須です。' }
      : code === 'content_required'
        ? { key: 'cardCsvImport.validation.contentRequired', text: '学習内容は必須です。' }
        : { key: 'cardCsvImport.validation.collectionNotFound', text: '指定されたコレクションが見つかりません。' };

  return {
    scope: 'row',
    rowNumber,
    code,
    messageKey: message.key,
    messageText: message.text,
    detail,
  };
}

function normalizeImportTagNames(tagNames: string[]): string[] {
  return Array.from(new Set((tagNames ?? []).map((tagName) => tagName.trim()).filter(Boolean)));
}

function buildImportSummary(rows: CardImportValidationRow[], headerSkipped: boolean, importedRows: number | null = null): CardImportSummary {
  const invalidRows = rows.filter((row) => row.status === 'invalid').length;
  const validRows = rows.length - invalidRows;

  return {
    totalRows: rows.length,
    headerSkipped,
    validRows,
    invalidRows,
    canImport: rows.length > 0 && invalidRows === 0,
    importedRows,
  };
}

async function resolveImportTagRows(
  tx: Prisma.TransactionClient,
  tagNames: string[],
): Promise<Array<{ id: string; name: string }>> {
  const tagRows = [] as Array<{ id: string; name: string }>;

  for (const tagName of tagNames) {
    const tag = await tx.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
      select: { id: true, name: true },
    });
    tagRows.push(tag);
  }

  return tagRows;
}

async function createCardRecord(
  tx: Prisma.TransactionClient,
  input: {
    title: string;
    content: string;
    answer?: string | null;
    collectionId?: string | null;
    tagNames: string[];
  },
  now: Date,
): Promise<ApiCard> {
  const createdCard = await tx.card.create({
    data: {
      title: input.title.trim(),
      content: input.content.trim(),
      answer: input.answer ?? null,
      collectionId: input.collectionId ?? null,
      proficiency: 0,
      nextReviewAt: now,
      lastCorrectRate: 0,
      isArchived: false,
    },
  });

  const tagRows = await resolveImportTagRows(tx, normalizeImportTagNames(input.tagNames));

  if (tagRows.length > 0) {
    await tx.cardTag.createMany({
      data: tagRows.map((tag) => ({ cardId: createdCard.id, tagId: tag.id })),
      skipDuplicates: true,
    });
  }

  return {
    id: createdCard.id,
    title: createdCard.title,
    content: createdCard.content,
    answer: createdCard.answer,
    tags: tagRows.map((tag) => tag.name),
    collectionId: createdCard.collectionId,
    proficiency: createdCard.proficiency,
    nextReviewAt: createdCard.nextReviewAt.toISOString(),
    lastCorrectRate: createdCard.lastCorrectRate,
    isArchived: createdCard.isArchived,
    createdAt: createdCard.createdAt.toISOString(),
    updatedAt: createdCard.updatedAt.toISOString(),
  } satisfies ApiCard;
}

export async function validateCardImportRows(
  rows: CardImportRow[],
  ownerId: string,
  headerSkipped = false,
): Promise<CardImportValidationResult> {
  const collections = await prisma.collection.findMany({
    where: { ownerId },
    select: { id: true, name: true, normalizedName: true },
  });

  const collectionMap = new Map(
    collections.map((collection) => [normalizeCollectionName(collection.normalizedName || collection.name), collection]),
  );

  const validatedRows = rows.map<CardImportValidationRow>((row) => {
    const issues: CardImportIssue[] = [];
    const title = row.title.trim();
    const content = row.content.trim();
    const answer = row.answer?.trim() ? row.answer.trim() : null;
    const tagNames = normalizeImportTagNames(row.tagNames ?? []);
    const collectionName = row.collectionName?.trim() ?? null;
    let resolvedCollectionId: string | null = null;

    if (title.length === 0) {
      issues.push(createCardImportIssue(row.rowNumber, 'title_required'));
    }

    if (content.length === 0) {
      issues.push(createCardImportIssue(row.rowNumber, 'content_required'));
    }

    if (collectionName) {
      const matchedCollection = collectionMap.get(normalizeCollectionName(collectionName));
      if (!matchedCollection) {
        issues.push(createCardImportIssue(row.rowNumber, 'collection_not_found', collectionName));
      } else {
        resolvedCollectionId = matchedCollection.id;
      }
    }

    return {
      rowNumber: row.rowNumber,
      title,
      content,
      answer,
      tagNames,
      collectionName,
      resolvedCollectionId,
      status: issues.length > 0 ? 'invalid' : 'valid',
      issues,
    };
  });

  return {
    summary: buildImportSummary(validatedRows, headerSkipped),
    rows: validatedRows,
    issues: validatedRows.flatMap((row) => row.issues),
  };
}

export async function importCards(
  rows: CardImportRow[],
  ownerId: string,
  headerSkipped = false,
): Promise<{ importedCount: number; messageKey: string }> {
  const validation = await validateCardImportRows(rows, ownerId, headerSkipped);
  if (!validation.summary.canImport) {
    throw new CardImportRepositoryError('VALIDATION_FAILED', 'card_import_validation_failed', validation);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      for (const row of validation.rows) {
        await createCardRecord(
          tx,
          {
            title: row.title,
            content: row.content,
            answer: row.answer,
            collectionId: row.resolvedCollectionId,
            tagNames: row.tagNames,
          },
          now,
        );
      }
    });

    logRepositoryEvent('info', 'import-cards-succeeded', {
      ownerId,
      rowCount: validation.summary.totalRows,
      headerSkipped,
    });

    return {
      importedCount: validation.summary.totalRows,
      messageKey: 'cardCsvImport.success.imported',
    };
  } catch (error) {
    if (error instanceof CardImportRepositoryError) {
      throw error;
    }

    logRepositoryEvent('error', 'import-cards-failed', {
      ownerId,
      rowCount: validation.summary.totalRows,
      headerSkipped,
      message: error instanceof Error ? error.message : 'unknown error',
    });
    throw new CardImportRepositoryError('DATABASE_ERROR', 'failed_to_import_cards');
  }
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

export async function resolveReviewTargetsForFilter(filter?: CardListFilter): Promise<ResolvedReviewTargetSet> {
  const query: ListCardsQuery = {
    cursor: undefined,
    limit: REVIEW_START_LIMIT,
    q: filter?.q,
    tagIds: filter?.tagIds ?? [],
    collectionIds: filter?.collectionIds ?? [],
    filter: filter?.filter,
    sort: filter?.sort ?? 'next_review_at',
  };

  const where: Prisma.CardWhereInput = { AND: buildCardBaseFilters(query) };
  const matchedCount = await prisma.card.count({ where });
  const rows = await prisma.card.findMany({
    where,
    orderBy: buildOrderBy(query.sort),
    take: REVIEW_START_LIMIT,
    select: { id: true },
  });

  const cardIds = rows.map((row) => row.id);
  return {
    cardIds,
    targetResolution: buildTargetResolution(matchedCount, cardIds.length, 0),
  };
}

export async function resolveReviewTargetsForCardIds(cardIds: string[]): Promise<ResolvedReviewTargetSet> {
  const requestedIds = Array.from(new Set(cardIds));
  const rows = await prisma.card.findMany({
    where: { id: { in: requestedIds }, isArchived: false },
    select: { id: true },
  });
  const availableIds = new Set(rows.map((row) => row.id));
  const includedIds = requestedIds.filter((cardId) => availableIds.has(cardId)).slice(0, REVIEW_START_LIMIT);
  const unavailableCount = requestedIds.filter((cardId) => !availableIds.has(cardId)).length;

  return {
    cardIds: includedIds,
    targetResolution: buildTargetResolution(requestedIds.length, includedIds.length, unavailableCount),
  };
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
  const tagRows = await prisma.tag.findMany({
    where: {
      OR: [{ id: { in: tags } }, { name: { in: tags } }],
    },
    select: { id: true },
  });

  const tagIds = tagRows.map((tag) => tag.id);
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

export async function searchTagOptions(q?: string, limit = 20): Promise<FilterOption[]> {
  const tags = await prisma.tag.findMany({
    where: q
      ? {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        }
      : undefined,
    orderBy: { name: 'asc' },
    take: limit,
    select: { id: true, name: true },
  });

  return tags.map((tag) => ({ id: tag.id, label: tag.name, matchedBy: 'name' }));
}

export async function searchCollectionOptions(q?: string, limit = 20): Promise<FilterOption[]> {
  const collections = await prisma.collection.findMany({
    where: q
      ? {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        }
      : undefined,
    orderBy: { name: 'asc' },
    take: limit,
    select: { id: true, name: true },
  });

  return collections.map((collection) => ({ id: collection.id, label: collection.name, matchedBy: 'name' }));
}

export async function createCard(input: CreateCardBody): Promise<ApiCard> {
  const normalizedTagNames = normalizeImportTagNames(input.tagNames ?? []);
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (input.collectionId) {
        const collection = await tx.collection.findUnique({
          where: { id: input.collectionId },
          select: { id: true, name: true },
        });

        if (!collection) {
          throw new CreateCardRepositoryError('COLLECTION_NOT_FOUND', 'collection_not_found');
        }
      }

      const card = await createCardRecord(
        tx,
        {
          title: input.title,
          content: input.content,
          answer: input.answer ?? null,
          collectionId: input.collectionId ?? null,
          tagNames: normalizedTagNames,
        },
        now,
      );

      logRepositoryEvent('info', 'create-card-succeeded', {
        cardId: card.id,
        tagCount: card.tags.length,
        hasAnswer: card.answer !== null,
        hasCollection: Boolean(input.collectionId),
      });

      return card;
    });

    return result;
  } catch (error) {
    if (error instanceof CreateCardRepositoryError) {
      logRepositoryEvent('error', 'create-card-rejected', {
        code: error.code,
        hasAnswer: input.answer !== null && input.answer !== undefined,
        hasCollection: Boolean(input.collectionId),
        tagCount: normalizedTagNames.length,
      });
      throw error;
    }

    logRepositoryEvent('error', 'create-card-failed', {
      code: 'DATABASE_ERROR',
      hasAnswer: input.answer !== null && input.answer !== undefined,
      hasCollection: Boolean(input.collectionId),
      tagCount: normalizedTagNames.length,
      message: error instanceof Error ? error.message : 'unknown error',
    });
    throw new CreateCardRepositoryError('DATABASE_ERROR', 'failed_to_persist_card');
  }
}
