import { prisma } from '../db/prisma.js';
import type { ApiCard, CardListFilter } from '../domain/cardList.js';
import {
  ReviewRepositoryError,
  type ReviewAssessment,
  type ReviewCardSnapshot,
  type ReviewNavigationDirection,
  type ReviewReason,
  type ReviewSessionSnapshot,
  type ReviewSessionSummary,
} from '../domain/review.js';

type ReviewSessionRow = {
  id: string;
  status: 'in_progress' | 'completed';
  currentCardIndex: number;
  totalCards: number;
  sourceQuery: string | null;
  sourceFilter: 'today' | 'overdue' | 'unlearned' | null;
  sourceSort: 'next_review_at' | 'proficiency' | 'created_at';
  sourceTagLabels: string[];
  sourceCollectionLabels: string[];
  completedAt: Date | null;
  cards: Array<{
    sessionId: string;
    cardId: string;
    orderIndex: number;
    assessment: ReviewAssessment | null;
    assessedAt: Date | null;
    lockedAt: Date | null;
    card: {
      id: string;
      title: string;
      content: string;
      answer: string | null;
      collection: { name: string } | null;
      nextReviewAt: Date;
      proficiency: number;
      tags: Array<{ tag: { name: string } | null }>;
    };
  }>;
};

type PrismaLabelClient = {
  tag: {
    findMany(args: { where: { id: { in: string[] } }; select: { name: true }; orderBy: { name: 'asc' } }): Promise<Array<{ name: string }>>;
  };
  collection: {
    findMany(args: { where: { id: { in: string[] } }; select: { name: true }; orderBy: { name: 'asc' } }): Promise<Array<{ name: string }>>;
  };
  reviewSession: {
    create(args: {
      data: {
        status: 'in_progress';
        currentCardIndex: number;
        totalCards: number;
        sourceQuery: string | null;
        sourceFilter: string | null;
        sourceSort: string;
        sourceTagLabels: string[];
        sourceCollectionLabels: string[];
      };
    }): Promise<{ id: string }>;
    findUnique(args: { where: { id: string }; include: unknown }): Promise<ReviewSessionRow | null>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  };
  reviewSessionCard: {
    createMany(args: { data: Array<{ sessionId: string; cardId: string; orderIndex: number }> }): Promise<unknown>;
    update(args: { where: { sessionId_cardId: { sessionId: string; cardId: string } }; data: Record<string, unknown> }): Promise<unknown>;
  };
  $transaction<T>(callback: (tx: PrismaLabelClient) => Promise<T>): Promise<T>;
};

function getPrismaClient(): PrismaLabelClient {
  return prisma as unknown as PrismaLabelClient;
}

async function resolveLabels(table: 'tag' | 'collection', ids: string[] | undefined): Promise<string[]> {
  if (!ids || ids.length === 0) return [];

  const client = getPrismaClient();
  const rows = await client[table].findMany({
    where: { id: { in: ids } },
    select: { name: true },
    orderBy: { name: 'asc' },
  });

  return rows.map((row: { name: string }) => row.name);
}

function buildReviewReason(session: ReviewSessionRow, card: ReviewSessionRow['cards'][number]['card'], explicitCardIds: boolean): ReviewReason {
  if (explicitCardIds) {
    return {
      label: '選択したカードを復習しています',
      detail: null,
      source: 'manual_selection',
    };
  }

  if (session.sourceFilter === 'overdue') {
    return {
      label: '期限を過ぎているため復習対象です',
      detail: card.nextReviewAt.toISOString(),
      source: 'overdue',
    };
  }

  if (session.sourceFilter === 'today') {
    return {
      label: '今日の復習対象に含まれています',
      detail: card.nextReviewAt.toISOString(),
      source: 'next_review_at',
    };
  }

  if (session.sourceFilter === 'unlearned' || card.proficiency <= 0) {
    return {
      label: '未学習カードとして復習対象です',
      detail: null,
      source: 'unlearned',
    };
  }

  return {
    label: '開始条件に一致したため復習対象です',
    detail: session.sourceQuery || null,
    source: 'filter_match',
  };
}

function buildSummary(cards: ReviewSessionRow['cards']): ReviewSessionSummary {
  let forgotCount = 0;
  let uncertainCount = 0;
  let rememberedCount = 0;
  let perfectCount = 0;

  for (const card of cards) {
    if (card.assessment === 'forgot') forgotCount += 1;
    if (card.assessment === 'uncertain') uncertainCount += 1;
    if (card.assessment === 'remembered') rememberedCount += 1;
    if (card.assessment === 'perfect') perfectCount += 1;
  }

  return {
    forgotCount,
    uncertainCount,
    rememberedCount,
    perfectCount,
    assessedCount: forgotCount + uncertainCount + rememberedCount + perfectCount,
    totalCount: cards.length,
  };
}

function toCardSnapshot(session: ReviewSessionRow, row: ReviewSessionRow['cards'][number], explicitCardIds: boolean): ReviewCardSnapshot {
  return {
    cardId: row.card.id,
    title: row.card.title,
    content: row.card.content,
    answer: row.card.answer,
    tags: row.card.tags.map((tagRow) => tagRow.tag?.name).filter((value): value is string => Boolean(value)),
    collectionLabel: row.card.collection?.name ?? null,
    nextReviewAt: row.card.nextReviewAt?.toISOString() ?? null,
    reviewReason: buildReviewReason(session, row.card, explicitCardIds),
    currentAssessment: row.assessment,
    locked: Boolean(row.lockedAt),
  };
}

async function loadSession(sessionId: string): Promise<ReviewSessionRow> {
  const client = getPrismaClient();
  const session = (await client.reviewSession.findUnique({
    where: { id: sessionId },
    include: {
      cards: {
        orderBy: { orderIndex: 'asc' },
        include: {
          card: {
            include: {
              collection: { select: { name: true } },
              tags: { include: { tag: true } },
            },
          },
        },
      },
    },
  })) as ReviewSessionRow | null;

  if (!session) {
    throw new ReviewRepositoryError('SESSION_NOT_FOUND', 'review_session_not_found');
  }

  return session;
}

export async function createReviewSession(input: { cardIds: string[]; filter?: CardListFilter }): Promise<ReviewSessionSnapshot> {
  const { cardIds, filter } = input;
  if (cardIds.length === 0) {
    throw new ReviewRepositoryError('NO_CARDS', 'review_session_has_no_cards');
  }

  const client = getPrismaClient();
  const tagLabels = await resolveLabels('tag', filter?.tagIds);
  const collectionLabels = await resolveLabels('collection', filter?.collectionIds);

  const created = await client.$transaction(async (tx) => {
    const session = await tx.reviewSession.create({
      data: {
        status: 'in_progress',
        currentCardIndex: 0,
        totalCards: cardIds.length,
        sourceQuery: filter?.q?.trim() || null,
        sourceFilter: filter?.filter ?? null,
        sourceSort: filter?.sort ?? 'next_review_at',
        sourceTagLabels: tagLabels,
        sourceCollectionLabels: collectionLabels,
      },
    });

    await tx.reviewSessionCard.createMany({
      data: cardIds.map((cardId, orderIndex) => ({
        sessionId: session.id,
        cardId,
        orderIndex,
      })),
    });

    return session;
  });

  return getReviewSessionSnapshot(created.id);
}

export async function getReviewSessionSnapshot(sessionId: string): Promise<ReviewSessionSnapshot> {
  const session = await loadSession(sessionId);
  const summary = buildSummary(session.cards);
  const explicitCardIds = !session.sourceFilter && !session.sourceQuery && session.sourceTagLabels.length === 0 && session.sourceCollectionLabels.length === 0;
  const currentRow = session.status === 'completed' ? null : session.cards[session.currentCardIndex] ?? null;

  return {
    sessionId: session.id,
    status: session.status,
    currentIndex: session.currentCardIndex,
    totalCount: session.totalCards,
    remainingCount: Math.max(session.totalCards - summary.assessedCount, 0),
    canGoPrev: session.status === 'in_progress' && session.currentCardIndex > 0,
    canGoNext:
      session.status === 'in_progress' &&
      currentRow !== null &&
      (Boolean(currentRow.lockedAt) || Boolean(currentRow.assessment)),
    filterSummary: {
      q: session.sourceQuery,
      filter: session.sourceFilter,
      sort: session.sourceSort,
      tagLabels: session.sourceTagLabels,
      collectionLabels: session.sourceCollectionLabels,
    },
    currentCard: currentRow ? toCardSnapshot(session, currentRow, explicitCardIds) : null,
    summary,
  };
}

export async function saveReviewAssessment(sessionId: string, cardId: string, assessment: ReviewAssessment): Promise<ReviewSessionSnapshot> {
  const session = await loadSession(sessionId);
  if (session.status === 'completed') {
    throw new ReviewRepositoryError('CARD_LOCKED', 'review_session_completed');
  }

  const currentRow = session.cards[session.currentCardIndex];
  if (!currentRow || currentRow.cardId !== cardId) {
    throw new ReviewRepositoryError('NOT_CURRENT_CARD', 'review_assessment_requires_current_card');
  }
  if (currentRow.lockedAt) {
    throw new ReviewRepositoryError('CARD_LOCKED', 'review_card_locked');
  }

  const client = getPrismaClient();
  await client.reviewSessionCard.update({
    where: { sessionId_cardId: { sessionId, cardId } },
    data: { assessment, assessedAt: new Date() },
  });

  return getReviewSessionSnapshot(sessionId);
}

export async function navigateReviewSession(sessionId: string, direction: ReviewNavigationDirection): Promise<ReviewSessionSnapshot> {
  const session = await loadSession(sessionId);
  if (session.status === 'completed') {
    return getReviewSessionSnapshot(sessionId);
  }

  const currentRow = session.cards[session.currentCardIndex];
  if (!currentRow) {
    throw new ReviewRepositoryError('SESSION_NOT_FOUND', 'review_current_card_missing');
  }

  const client = getPrismaClient();

  if (direction === 'prev') {
    if (session.currentCardIndex === 0) {
      return getReviewSessionSnapshot(sessionId);
    }

    await client.reviewSession.update({
      where: { id: sessionId },
      data: { currentCardIndex: session.currentCardIndex - 1 },
    });

    return getReviewSessionSnapshot(sessionId);
  }

  if (!currentRow.lockedAt && !currentRow.assessment) {
    throw new ReviewRepositoryError('ASSESSMENT_REQUIRED', 'review_next_requires_assessment');
  }

  await client.$transaction(async (tx) => {
    if (!currentRow.lockedAt) {
      await tx.reviewSessionCard.update({
        where: { sessionId_cardId: { sessionId, cardId: currentRow.cardId } },
        data: { lockedAt: new Date() },
      });
    }

    if (session.currentCardIndex >= session.totalCards - 1) {
      await tx.reviewSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          currentCardIndex: session.totalCards,
          completedAt: new Date(),
        },
      });
      return;
    }

    await tx.reviewSession.update({
      where: { id: sessionId },
      data: { currentCardIndex: session.currentCardIndex + 1 },
    });
  });

  return getReviewSessionSnapshot(sessionId);
}

export async function resolveReviewCards(cardIds: string[], cards: ApiCard[]): Promise<string[]> {
  const cardMap = new Map(cards.map((card) => [card.id, card.id]));
  return cardIds.filter((cardId) => cardMap.has(cardId));
}