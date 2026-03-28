export type StatisticsRange = 'today' | '7d' | '30d' | 'all';

export type StatisticsSectionKey = 'accuracyTrend' | 'tagBreakdown' | 'insights';

export type SummaryMetric = {
  value: number;
  deltaFromPrevious: number | null;
  unit: 'count' | 'percent' | 'days';
  displayHint: string | null;
};

export type StreakMetric = {
  value: number;
  deltaFromPrevious: number | null;
  unit: 'days';
  bestRecordDays: number | null;
  displayHint: string | null;
};

export type StatisticsSummary = {
  totalCardCount: SummaryMetric;
  completedReviewCount: SummaryMetric;
  averageAccuracy: SummaryMetric | null;
  streakDays: StreakMetric;
};

export type TrendPoint = {
  key: string;
  label: string;
  value: number;
  from: string;
  to: string;
};

export type TrendSeries = {
  metric: 'completed_reviews' | 'average_accuracy';
  bucketUnit: 'hour' | 'day' | 'month';
  points: TrendPoint[];
};

export type TagBreakdownItem = {
  tagId: string;
  tagName: string;
  reviewCount: number;
  averageAccuracy: number | null;
  isWeakest: boolean;
};

export type InsightItem = {
  id: string;
  kind: 'trend' | 'focus';
  message: string;
  relatedTagId: string | null;
};

export type StatisticsState = {
  mode: 'ready' | 'empty' | 'partial';
  unavailableSections: StatisticsSectionKey[];
  message: string | null;
};

export type StatisticsDashboardResponse = {
  generatedAt: string;
  selectedRange: StatisticsRange;
  summary: StatisticsSummary;
  volumeTrend: TrendSeries;
  accuracyTrend: TrendSeries | null;
  tagBreakdown: TagBreakdownItem[];
  insights: InsightItem[];
  state: StatisticsState;
};

export type CachedStatisticsDashboard = {
  range: StatisticsRange;
  snapshot: StatisticsDashboardResponse;
  cachedAt: string;
};