import { z } from 'zod';

export const statisticsRangeSchema = z.enum(['today', '7d', '30d', 'all']);
export const statisticsSectionKeySchema = z.enum(['accuracyTrend', 'tagBreakdown', 'insights']);

export const summaryMetricSchema = z.object({
  value: z.number().min(0),
  deltaFromPrevious: z.number().nullable(),
  unit: z.enum(['count', 'percent', 'days']),
  displayHint: z.string().nullable(),
});

export const streakMetricSchema = z.object({
  value: z.number().int().min(0),
  deltaFromPrevious: z.number().nullable(),
  unit: z.literal('days'),
  bestRecordDays: z.number().int().min(0).nullable(),
  displayHint: z.string().nullable(),
});

export const statisticsSummarySchema = z.object({
  totalCardCount: summaryMetricSchema,
  completedReviewCount: summaryMetricSchema,
  averageAccuracy: summaryMetricSchema.nullable(),
  streakDays: streakMetricSchema,
});

export const trendPointSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.number().min(0),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const trendSeriesSchema = z.object({
  metric: z.enum(['completed_reviews', 'average_accuracy']),
  bucketUnit: z.enum(['hour', 'day', 'month']),
  points: z.array(trendPointSchema),
});

export const tagBreakdownItemSchema = z.object({
  tagId: z.string().min(1),
  tagName: z.string().min(1),
  reviewCount: z.number().int().min(0),
  averageAccuracy: z.number().min(0).max(100).nullable(),
  isWeakest: z.boolean(),
});

export const insightItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['trend', 'focus']),
  message: z.string().min(1),
  relatedTagId: z.string().min(1).nullable(),
});

export const statisticsStateSchema = z.object({
  mode: z.enum(['ready', 'empty', 'partial']),
  unavailableSections: z.array(statisticsSectionKeySchema),
  message: z.string().nullable(),
});

export const statisticsDashboardResponseSchema = z.object({
  generatedAt: z.string().datetime(),
  selectedRange: statisticsRangeSchema,
  summary: statisticsSummarySchema,
  volumeTrend: trendSeriesSchema,
  accuracyTrend: trendSeriesSchema.nullable(),
  tagBreakdown: z.array(tagBreakdownItemSchema).max(5),
  insights: z.array(insightItemSchema).max(2),
  state: statisticsStateSchema,
});

export type StatisticsRange = z.infer<typeof statisticsRangeSchema>;
export type StatisticsSectionKey = z.infer<typeof statisticsSectionKeySchema>;
export type SummaryMetric = z.infer<typeof summaryMetricSchema>;
export type StreakMetric = z.infer<typeof streakMetricSchema>;
export type StatisticsSummary = z.infer<typeof statisticsSummarySchema>;
export type TrendPoint = z.infer<typeof trendPointSchema>;
export type TrendSeries = z.infer<typeof trendSeriesSchema>;
export type TagBreakdownItem = z.infer<typeof tagBreakdownItemSchema>;
export type InsightItem = z.infer<typeof insightItemSchema>;
export type StatisticsState = z.infer<typeof statisticsStateSchema>;
export type StatisticsDashboardResponse = z.infer<typeof statisticsDashboardResponseSchema>;