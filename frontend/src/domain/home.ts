export type HomeActivityType = 'review_completed' | 'review_started' | 'card_created';

export type HomeRecentActivity = {
  id: string;
  type: HomeActivityType;
  occurredAt: string;
  label: string;
  count: number | null;
};

export type HomeSummary = {
  todayDueCount: number;
  overdueCount: number;
  unlearnedCount: number;
  streakDays: number;
};

export type HomeViewState = {
  firstUse: boolean;
  noReviewToday: boolean;
};

export type HomeDashboardResponse = {
  generatedAt: string;
  summary: HomeSummary;
  recentActivities: HomeRecentActivity[];
  state: HomeViewState;
};