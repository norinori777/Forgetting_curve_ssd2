import { prisma } from '../db/prisma.js';
import type {
  InsightItem,
  StatisticsDashboardResponse,
  StatisticsRange,
  StatisticsSectionKey,
  SummaryMetric,
  TagBreakdownItem,
  TrendPoint,
  TrendSeries,
} from '../schemas/stats.js';

type ReviewRow = {
  cardId: string;
  assessment: string | null;
  assessedAt: Date;
};

type CardTagRow = {
  cardId: string;
  tagId: string;
  tag: { name: string };
};

type TimeWindow = {
  start: Date | null;
  end: Date;
  previousStart: Date | null;
  previousEnd: Date | null;
};

const assessmentWeights: Record<string, number> = {
  forgot: 0,
  uncertain: 50,
  remembered: 100,
  perfect: 100,
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function startOfUtcHour(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), 0, 0, 0));
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addUtcHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addUtcMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1, 0, 0, 0, 0));
}

function getTimeWindow(range: StatisticsRange, now: Date): TimeWindow {
  const currentEnd = now;

  if (range === 'today') {
    const start = startOfUtcDay(now);
    const previousStart = addUtcDays(start, -1);
    const previousEnd = new Date(start.getTime() - 1);
    return { start, end: currentEnd, previousStart, previousEnd };
  }

  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30;
    const start = startOfUtcDay(addUtcDays(now, -(days - 1)));
    const duration = currentEnd.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);
    return { start, end: currentEnd, previousStart, previousEnd };
  }

  return {
    start: null,
    end: currentEnd,
    previousStart: null,
    previousEnd: null,
  };
}

function buildReviewWhere(window: { start: Date | null; end: Date }) {
  if (window.start === null) {
    return {
      assessedAt: { not: null as null },
      card: { isArchived: false },
    };
  }

  return {
    assessedAt: {
      gte: window.start,
      lte: window.end,
    },
    card: { isArchived: false },
  };
}

function toReviewRows(rows: Array<{ cardId: string; assessment: string | null; assessedAt: Date | null }>): ReviewRow[] {
  return rows.filter((row): row is ReviewRow => row.assessedAt instanceof Date);
}

function mapAssessmentToScore(assessment: string | null): number | null {
  if (!assessment) return null;
  return assessment in assessmentWeights ? assessmentWeights[assessment] : null;
}

function formatDelta(delta: number | null, unit: 'count' | 'percent'): string | null {
  if (delta === null) return null;
  const prefix = delta > 0 ? '+' : '';
  return unit === 'percent' ? `前期間比 ${prefix}${delta}pt` : `前期間比 ${prefix}${delta}`;
}

function buildSummaryMetric(value: number, deltaFromPrevious: number | null, unit: 'count' | 'percent' | 'days'): SummaryMetric {
  return {
    value,
    deltaFromPrevious,
    unit,
    displayHint: unit === 'days' ? null : formatDelta(deltaFromPrevious, unit === 'percent' ? 'percent' : 'count'),
  };
}

function averageAccuracy(rows: ReviewRow[]): number | null {
  const scores = rows.map((row) => mapAssessmentToScore(row.assessment)).filter((value): value is number => typeof value === 'number');
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10;
}

function toUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildCurrentStreak(assessedAtValues: Date[], now: Date): number {
  const dayKeys = new Set(assessedAtValues.map(toUtcDayKey));
  let streakDays = 0;
  let cursor = startOfUtcDay(now);

  while (dayKeys.has(toUtcDayKey(cursor))) {
    streakDays += 1;
    cursor = addUtcDays(cursor, -1);
  }

  return streakDays;
}

function buildBestStreak(assessedAtValues: Date[]): number {
  const uniqueDays = [...new Set(assessedAtValues.map(toUtcDayKey))].sort();
  let best = 0;
  let current = 0;
  let previous: Date | null = null;

  for (const dayKey of uniqueDays) {
    const day = new Date(`${dayKey}T00:00:00.000Z`);
    if (previous && day.getTime() - previous.getTime() === 24 * 60 * 60 * 1000) {
      current += 1;
    } else {
      current = 1;
    }
    previous = day;
    best = Math.max(best, current);
  }

  return best;
}

function buildBucketPoints(range: StatisticsRange, now: Date, allStart: Date | null): TrendPoint[] {
  if (range === 'today') {
    const start = startOfUtcDay(now);
    return Array.from({ length: 24 }, (_, index) => {
      const from = addUtcHours(start, index);
      const to = new Date(addUtcHours(start, index + 1).getTime() - 1);
      return {
        key: from.toISOString(),
        label: `${String(from.getUTCHours()).padStart(2, '0')}:00`,
        value: 0,
        from: from.toISOString(),
        to: to.toISOString(),
      };
    });
  }

  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30;
    const start = startOfUtcDay(addUtcDays(now, -(days - 1)));
    return Array.from({ length: days }, (_, index) => {
      const from = addUtcDays(start, index);
      const to = endOfUtcDay(from);
      return {
        key: from.toISOString(),
        label: `${from.getUTCMonth() + 1}/${from.getUTCDate()}`,
        value: 0,
        from: from.toISOString(),
        to: to.toISOString(),
      };
    });
  }

  const firstMonth = startOfUtcMonth(allStart ?? now);
  const lastMonth = startOfUtcMonth(now);
  const points: TrendPoint[] = [];
  let cursor = firstMonth;

  while (cursor.getTime() <= lastMonth.getTime()) {
    const nextMonth = addUtcMonths(cursor, 1);
    points.push({
      key: cursor.toISOString(),
      label: `${cursor.getUTCFullYear()}/${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`,
      value: 0,
      from: cursor.toISOString(),
      to: new Date(nextMonth.getTime() - 1).toISOString(),
    });
    cursor = nextMonth;
  }

  return points;
}

function buildTrendSeries(range: StatisticsRange, metric: 'completed_reviews' | 'average_accuracy', rows: ReviewRow[], now: Date, allStart: Date | null): TrendSeries {
  const bucketUnit = range === 'today' ? 'hour' : range === 'all' ? 'month' : 'day';
  const points = buildBucketPoints(range, now, allStart);
  const bucketMap = new Map(points.map((point, index) => [point.key, index]));
  const aggregations = new Map<string, { count: number; total: number }>();

  for (const row of rows) {
    if (!(row.assessedAt instanceof Date)) continue;

    let bucketKey: string;
    if (bucketUnit === 'hour') {
      bucketKey = startOfUtcHour(row.assessedAt).toISOString();
    } else if (bucketUnit === 'day') {
      bucketKey = startOfUtcDay(row.assessedAt).toISOString();
    } else {
      bucketKey = startOfUtcMonth(row.assessedAt).toISOString();
    }

    const current = aggregations.get(bucketKey) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += mapAssessmentToScore(row.assessment) ?? 0;
    aggregations.set(bucketKey, current);
  }

  for (const [bucketKey, aggregation] of aggregations.entries()) {
    const pointIndex = bucketMap.get(bucketKey);
    if (pointIndex === undefined) continue;
    if (metric === 'completed_reviews') {
      points[pointIndex] = { ...points[pointIndex], value: aggregation.count };
    } else {
      const scoredRows = rows.filter((row) => {
        if (!(row.assessedAt instanceof Date)) return false;
        const rowBucketKey = bucketUnit === 'hour' ? startOfUtcHour(row.assessedAt).toISOString() : bucketUnit === 'day' ? startOfUtcDay(row.assessedAt).toISOString() : startOfUtcMonth(row.assessedAt).toISOString();
        return rowBucketKey === bucketKey && mapAssessmentToScore(row.assessment) !== null;
      });
      if (scoredRows.length === 0) continue;
      const average = averageAccuracy(scoredRows);
      points[pointIndex] = { ...points[pointIndex], value: average ?? 0 };
    }
  }

  return { metric, bucketUnit, points };
}

function buildTagBreakdown(rows: ReviewRow[], tagRows: CardTagRow[]): TagBreakdownItem[] {
  const tagsByCardId = new Map<string, Array<{ tagId: string; tagName: string }>>();
  for (const row of tagRows) {
    const items = tagsByCardId.get(row.cardId) ?? [];
    items.push({ tagId: row.tagId, tagName: row.tag.name });
    tagsByCardId.set(row.cardId, items);
  }

  const stats = new Map<string, { tagId: string; tagName: string; reviewCount: number; totalScore: number; scoredCount: number }>();

  for (const row of rows) {
    const tags = tagsByCardId.get(row.cardId) ?? [];
    const score = mapAssessmentToScore(row.assessment);
    for (const tag of tags) {
      const current = stats.get(tag.tagId) ?? { tagId: tag.tagId, tagName: tag.tagName, reviewCount: 0, totalScore: 0, scoredCount: 0 };
      current.reviewCount += 1;
      if (score !== null) {
        current.totalScore += score;
        current.scoredCount += 1;
      }
      stats.set(tag.tagId, current);
    }
  }

  const items = [...stats.values()]
    .map((item) => ({
      tagId: item.tagId,
      tagName: item.tagName,
      reviewCount: item.reviewCount,
      averageAccuracy: item.scoredCount === 0 ? null : Math.round((item.totalScore / item.scoredCount) * 10) / 10,
      isWeakest: false,
    }))
    .sort((left, right) => {
      if (right.reviewCount !== left.reviewCount) return right.reviewCount - left.reviewCount;
      const leftAccuracy = left.averageAccuracy ?? Number.POSITIVE_INFINITY;
      const rightAccuracy = right.averageAccuracy ?? Number.POSITIVE_INFINITY;
      if (leftAccuracy !== rightAccuracy) return leftAccuracy - rightAccuracy;
      return left.tagName.localeCompare(right.tagName, 'ja');
    })
    .slice(0, 5);

  const weakest = [...items]
    .filter((item) => item.averageAccuracy !== null)
    .sort((left, right) => {
      if ((left.averageAccuracy ?? 0) !== (right.averageAccuracy ?? 0)) return (left.averageAccuracy ?? 0) - (right.averageAccuracy ?? 0);
      if (right.reviewCount !== left.reviewCount) return right.reviewCount - left.reviewCount;
      return left.tagName.localeCompare(right.tagName, 'ja');
    })[0];

  return items.map((item) => ({ ...item, isWeakest: weakest?.tagId === item.tagId }));
}

function buildInsights(input: {
  selectedRange: StatisticsRange;
  completedReviewCount: number;
  completedDelta: number | null;
  weakestTag: TagBreakdownItem | undefined;
}): InsightItem[] {
  const insights: InsightItem[] = [];

  if (input.selectedRange === 'all' || input.completedDelta === null) {
    insights.push({
      id: 'trend-overview',
      kind: 'trend',
      message: `全期間で ${input.completedReviewCount} 件のレビュー回答を記録しています。`,
      relatedTagId: null,
    });
  } else if (input.completedDelta > 0) {
    insights.push({
      id: 'trend-overview',
      kind: 'trend',
      message: `レビュー完了数は前期間より ${input.completedDelta} 件増えています。`,
      relatedTagId: null,
    });
  } else if (input.completedDelta < 0) {
    insights.push({
      id: 'trend-overview',
      kind: 'trend',
      message: `レビュー完了数は前期間より ${Math.abs(input.completedDelta)} 件減っています。`,
      relatedTagId: null,
    });
  } else {
    insights.push({
      id: 'trend-overview',
      kind: 'trend',
      message: 'レビュー完了数は前期間と同水準です。',
      relatedTagId: null,
    });
  }

  if (input.weakestTag) {
    const accuracyText = input.weakestTag.averageAccuracy === null ? '集計中' : `${Math.round(input.weakestTag.averageAccuracy)}%`;
    insights.push({
      id: 'focus-weakest-tag',
      kind: 'focus',
      message: `要改善: ${input.weakestTag.tagName}（正答率 ${accuracyText}）`,
      relatedTagId: input.weakestTag.tagId,
    });
  }

  return insights.slice(0, 2);
}

function buildPartialMessage(unavailableSections: StatisticsSectionKey[]): string | null {
  if (unavailableSections.length === 0) return null;
  if (unavailableSections.includes('accuracyTrend')) {
    return '一部の統計を表示できません。正答率の履歴は未取得ですが、学習量とレビュー完了数は確認できます。';
  }
  if (unavailableSections.includes('tagBreakdown')) {
    return '一部の統計を表示できません。タグ別内訳の取得に失敗したため、表示できる統計だけを表示しています。';
  }
  return '一部の統計を表示できません。表示できる統計だけを表示しています。';
}

export async function getStatisticsDashboard(selectedRange: StatisticsRange, now = new Date()): Promise<StatisticsDashboardResponse> {
  const window = getTimeWindow(selectedRange, now);

  const [totalCardCount, currentCreatedCount, previousCreatedCount, currentRowsRaw, previousRowsRaw, streakRowsRaw] = await Promise.all([
    prisma.card.count({ where: { isArchived: false } }),
    window.start === null
      ? Promise.resolve(null)
      : prisma.card.count({
          where: {
            isArchived: false,
            createdAt: {
              gte: window.start,
              lte: window.end,
            },
          },
        }),
    window.previousStart === null || window.previousEnd === null
      ? Promise.resolve(null)
      : prisma.card.count({
          where: {
            isArchived: false,
            createdAt: {
              gte: window.previousStart,
              lte: window.previousEnd,
            },
          },
        }),
    prisma.reviewSessionCard.findMany({
      where: buildReviewWhere({ start: window.start, end: window.end }),
      select: {
        cardId: true,
        assessment: true,
        assessedAt: true,
      },
    }),
    window.previousStart === null || window.previousEnd === null
      ? Promise.resolve([])
      : prisma.reviewSessionCard.findMany({
          where: buildReviewWhere({ start: window.previousStart, end: window.previousEnd }),
          select: {
            cardId: true,
            assessment: true,
            assessedAt: true,
          },
        }),
    prisma.reviewSessionCard.findMany({
      where: {
        assessedAt: { not: null },
        card: { isArchived: false },
      },
      select: {
        assessedAt: true,
      },
    }),
  ]);

  const currentRows = toReviewRows(currentRowsRaw);
  const previousRows = toReviewRows(previousRowsRaw);
  const allAssessedAtValues = streakRowsRaw.map((row) => row.assessedAt).filter((value): value is Date => value instanceof Date);
  const allRangeStart =
    selectedRange === 'all' && currentRows.length > 0
      ? currentRows.reduce<Date>((earliest, row) => (row.assessedAt.getTime() < earliest.getTime() ? row.assessedAt : earliest), currentRows[0].assessedAt)
      : null;

  const completedReviewCount = currentRows.length;
  const previousCompletedReviewCount = previousRows.length;
  const currentAverageAccuracy = averageAccuracy(currentRows);
  const previousAverageAccuracy = averageAccuracy(previousRows);
  const streakDays = buildCurrentStreak(allAssessedAtValues, now);
  const bestRecordDays = buildBestStreak(allAssessedAtValues);

  const unavailableSections: StatisticsSectionKey[] = [];
  const volumeTrend = buildTrendSeries(selectedRange, 'completed_reviews', currentRows, now, allRangeStart);
  let accuracyTrend = currentRows.length === 0 ? buildTrendSeries(selectedRange, 'average_accuracy', [], now, allRangeStart) : null;

  if (currentRows.length > 0) {
    const assessedRows = currentRows.filter((row) => mapAssessmentToScore(row.assessment) !== null);
    if (assessedRows.length === 0) {
      unavailableSections.push('accuracyTrend');
    } else {
      accuracyTrend = buildTrendSeries(selectedRange, 'average_accuracy', assessedRows, now, allRangeStart);
    }
  }

  let tagBreakdown: TagBreakdownItem[] = [];
  let insights: InsightItem[] = [];

  if (currentRows.length > 0) {
    try {
      const tagRows = await prisma.cardTag.findMany({
        where: { cardId: { in: [...new Set(currentRows.map((row) => row.cardId))] } },
        select: {
          cardId: true,
          tagId: true,
          tag: { select: { name: true } },
        },
      });

      tagBreakdown = buildTagBreakdown(currentRows, tagRows as CardTagRow[]);
      insights = buildInsights({
        selectedRange,
        completedReviewCount,
        completedDelta: window.previousStart === null ? null : completedReviewCount - previousCompletedReviewCount,
        weakestTag: tagBreakdown.find((item) => item.isWeakest),
      });
    } catch {
      unavailableSections.push('tagBreakdown', 'insights');
      tagBreakdown = [];
      insights = [];
    }
  }

  const stateMode = completedReviewCount === 0 ? 'empty' : unavailableSections.length > 0 ? 'partial' : 'ready';

  return {
    generatedAt: now.toISOString(),
    selectedRange,
    summary: {
      totalCardCount: buildSummaryMetric(totalCardCount, currentCreatedCount === null || previousCreatedCount === null ? null : currentCreatedCount - previousCreatedCount, 'count'),
      completedReviewCount: buildSummaryMetric(completedReviewCount, window.previousStart === null ? null : completedReviewCount - previousCompletedReviewCount, 'count'),
      averageAccuracy:
        currentAverageAccuracy === null
          ? null
          : buildSummaryMetric(currentAverageAccuracy, previousAverageAccuracy === null ? null : Math.round((currentAverageAccuracy - previousAverageAccuracy) * 10) / 10, 'percent'),
      streakDays: {
        value: streakDays,
        deltaFromPrevious: null,
        unit: 'days',
        bestRecordDays,
        displayHint: bestRecordDays > 0 ? `最高記録 ${bestRecordDays}日` : '最高記録はまだありません',
      },
    },
    volumeTrend,
    accuracyTrend,
    tagBreakdown,
    insights,
    state: {
      mode: stateMode,
      unavailableSections: stateMode === 'empty' ? [] : [...new Set(unavailableSections)],
      message:
        stateMode === 'empty'
          ? 'まだ統計を表示できるだけの学習履歴がありません。まずはカードを追加して復習を始めると、ここに推移と内訳が表示されます。'
          : buildPartialMessage([...new Set(unavailableSections)]),
    },
  };
}