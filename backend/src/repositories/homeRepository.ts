import { prisma } from '../db/prisma.js';
import type { HomeDashboardResponse, HomeRecentActivity } from '../schemas/home.js';

function utcTodayRange(now: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  return { start, end };
}

function toUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildStreakDays(completedAtValues: Date[], now: Date): number {
  const completedDayKeys = new Set(completedAtValues.map(toUtcDayKey));
  let streakDays = 0;
  let cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

  while (completedDayKeys.has(toUtcDayKey(cursor))) {
    streakDays += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  return streakDays;
}

function buildRecentActivities(input: {
  started: Array<{ id: string; createdAt: Date; totalCards: number }>;
  completed: Array<{ id: string; completedAt: Date; totalCards: number }>;
  created: Array<{ id: string; createdAt: Date }>;
}): HomeRecentActivity[] {
  const items: HomeRecentActivity[] = [
    ...input.completed.map((row) => ({
      id: `review-completed:${row.id}`,
      type: 'review_completed' as const,
      occurredAt: row.completedAt.toISOString(),
      label: `${row.totalCards}件の復習を完了`,
      count: row.totalCards,
    })),
    ...input.started.map((row) => ({
      id: `review-started:${row.id}`,
      type: 'review_started' as const,
      occurredAt: row.createdAt.toISOString(),
      label: `${row.totalCards}件の復習を開始`,
      count: row.totalCards,
    })),
    ...input.created.map((row) => ({
      id: `card-created:${row.id}`,
      type: 'card_created' as const,
      occurredAt: row.createdAt.toISOString(),
      label: '学習カードを追加',
      count: 1,
    })),
  ];

  return items.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)).slice(0, 3);
}

export async function getHomeDashboard(now = new Date()): Promise<HomeDashboardResponse> {
  const { start, end } = utcTodayRange(now);

  const [todayDueCount, overdueCount, unlearnedCount, activeCardCount, startedSessions, completedSessions, createdCards, streakRows] = await Promise.all([
    prisma.card.count({ where: { isArchived: false, nextReviewAt: { lte: end } } }),
    prisma.card.count({ where: { isArchived: false, nextReviewAt: { lt: start } } }),
    prisma.card.count({ where: { isArchived: false, proficiency: 0 } }),
    prisma.card.count({ where: { isArchived: false } }),
    prisma.reviewSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, createdAt: true, totalCards: true },
    }),
    prisma.reviewSession.findMany({
      where: { status: 'completed', completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 3,
      select: { id: true, completedAt: true, totalCards: true },
    }),
    prisma.card.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true, createdAt: true },
    }),
    prisma.reviewSession.findMany({
      where: { status: 'completed', completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    }),
  ]);

  const streakDays = buildStreakDays(
    streakRows.map((row) => row.completedAt).filter((value): value is Date => value instanceof Date),
    now,
  );

  return {
    generatedAt: now.toISOString(),
    summary: {
      todayDueCount,
      overdueCount,
      unlearnedCount,
      streakDays,
    },
    recentActivities: buildRecentActivities({
      started: startedSessions,
      completed: completedSessions
        .map((row) => ({ ...row, completedAt: row.completedAt }))
        .filter((row): row is { id: string; completedAt: Date; totalCards: number } => row.completedAt instanceof Date),
      created: createdCards,
    }),
    state: {
      firstUse: activeCardCount === 0,
      noReviewToday: todayDueCount === 0,
    },
  };
}