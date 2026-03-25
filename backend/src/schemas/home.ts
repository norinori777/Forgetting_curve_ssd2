import { z } from 'zod';

export const homeActivityTypeSchema = z.enum(['review_completed', 'review_started', 'card_created']);

export const homeRecentActivitySchema = z.object({
  id: z.string().min(1),
  type: homeActivityTypeSchema,
  occurredAt: z.string().datetime(),
  label: z.string().min(1),
  count: z.number().int().min(0).nullable(),
});

export const homeSummarySchema = z.object({
  todayDueCount: z.number().int().min(0),
  overdueCount: z.number().int().min(0),
  unlearnedCount: z.number().int().min(0),
  streakDays: z.number().int().min(0),
});

export const homeViewStateSchema = z.object({
  firstUse: z.boolean(),
  noReviewToday: z.boolean(),
});

export const homeDashboardResponseSchema = z.object({
  generatedAt: z.string().datetime(),
  summary: homeSummarySchema,
  recentActivities: z.array(homeRecentActivitySchema).max(3),
  state: homeViewStateSchema,
});

export type HomeActivityType = z.infer<typeof homeActivityTypeSchema>;
export type HomeRecentActivity = z.infer<typeof homeRecentActivitySchema>;
export type HomeSummary = z.infer<typeof homeSummarySchema>;
export type HomeViewState = z.infer<typeof homeViewStateSchema>;
export type HomeDashboardResponse = z.infer<typeof homeDashboardResponseSchema>;