import { Prisma } from '@prisma/client';

import { prisma } from '../db/prisma.js';

export type CollectionManagementItem = {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
  updatedAt: string;
  canDelete: boolean;
  deleteBlockedReason: string | null;
};

export type CreateManagedCollectionInput = {
  ownerId: string;
  name: string;
  description: string | null;
};

export type UpdateManagedCollectionInput = CreateManagedCollectionInput & {
  collectionId: string;
};

type CollectionRepositoryErrorCode = 'DUPLICATE_NAME' | 'NOT_FOUND' | 'COLLECTION_IN_USE';

export class CollectionRepositoryError extends Error {
  constructor(
    public readonly code: CollectionRepositoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CollectionRepositoryError';
  }
}

export function normalizeCollectionName(name: string): string {
  return name.trim().toLocaleLowerCase('ja-JP');
}

function normalizeCollectionDescription(description: string | null): string {
  return description?.trim() ?? '';
}

function logRepositoryEvent(level: 'info' | 'error', event: string, metadata: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'test') return;

  const payload = JSON.stringify({
    scope: 'collectionRepository',
    event,
    ...metadata,
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.info(payload);
}

function mapCollectionRecord(record: {
  id: string;
  name: string;
  description: string;
  updatedAt: Date;
  _count: { cards: number };
}): CollectionManagementItem {
  const cardCount = record._count.cards;

  return {
    id: record.id,
    name: record.name,
    description: record.description.length > 0 ? record.description : null,
    cardCount,
    updatedAt: record.updatedAt.toISOString(),
    canDelete: cardCount === 0,
    deleteBlockedReason: cardCount > 0 ? 'カードが残っているため削除できません。' : null,
  };
}

function isDuplicateError(error: unknown): boolean {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
    || (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2002')
  );
}

export async function listManagedCollections(ownerId: string): Promise<CollectionManagementItem[]> {
  const items = await prisma.collection.findMany({
    where: { ownerId },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      name: true,
      description: true,
      updatedAt: true,
      _count: {
        select: { cards: true },
      },
    },
  });

  return items.map(mapCollectionRecord);
}

export async function createManagedCollection(input: CreateManagedCollectionInput): Promise<CollectionManagementItem> {
  try {
    const created = await prisma.collection.create({
      data: {
        ownerId: input.ownerId,
        name: input.name.trim(),
        normalizedName: normalizeCollectionName(input.name),
        description: normalizeCollectionDescription(input.description),
      },
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
        _count: {
          select: { cards: true },
        },
      },
    });

    logRepositoryEvent('info', 'create-managed-collection-succeeded', {
      ownerId: input.ownerId,
      collectionId: created.id,
    });

    return mapCollectionRecord(created);
  } catch (error) {
    if (isDuplicateError(error)) {
      throw new CollectionRepositoryError('DUPLICATE_NAME', 'duplicate_name');
    }

    logRepositoryEvent('error', 'create-managed-collection-failed', {
      ownerId: input.ownerId,
      code: error instanceof Error ? error.name : 'UNKNOWN',
    });
    throw error;
  }
}

export async function updateManagedCollection(input: UpdateManagedCollectionInput): Promise<CollectionManagementItem> {
  const existing = await prisma.collection.findFirst({
    where: {
      id: input.collectionId,
      ownerId: input.ownerId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new CollectionRepositoryError('NOT_FOUND', 'collection_not_found');
  }

  try {
    const updated = await prisma.collection.update({
      where: { id: input.collectionId },
      data: {
        name: input.name.trim(),
        normalizedName: normalizeCollectionName(input.name),
        description: normalizeCollectionDescription(input.description),
      },
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
        _count: {
          select: { cards: true },
        },
      },
    });

    logRepositoryEvent('info', 'update-managed-collection-succeeded', {
      ownerId: input.ownerId,
      collectionId: updated.id,
    });

    return mapCollectionRecord(updated);
  } catch (error) {
    if (isDuplicateError(error)) {
      throw new CollectionRepositoryError('DUPLICATE_NAME', 'duplicate_name');
    }

    logRepositoryEvent('error', 'update-managed-collection-failed', {
      ownerId: input.ownerId,
      collectionId: input.collectionId,
      code: error instanceof Error ? error.name : 'UNKNOWN',
    });
    throw error;
  }
}

export async function deleteManagedCollection(ownerId: string, collectionId: string): Promise<void> {
  const existing = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      ownerId,
    },
    select: {
      id: true,
      _count: {
        select: { cards: true },
      },
    },
  });

  if (!existing) {
    throw new CollectionRepositoryError('NOT_FOUND', 'collection_not_found');
  }

  if (existing._count.cards > 0) {
    throw new CollectionRepositoryError('COLLECTION_IN_USE', 'collection_in_use');
  }

  await prisma.collection.delete({
    where: { id: collectionId },
  });

  logRepositoryEvent('info', 'delete-managed-collection-succeeded', {
    ownerId,
    collectionId,
  });
}