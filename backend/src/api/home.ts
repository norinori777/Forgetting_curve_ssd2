import { Router } from 'express';

import { getHomeDashboard } from '../repositories/homeRepository.js';

export const homeRouter = Router();

function logApiEvent(level: 'info' | 'error', event: string, metadata: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'test') return;

  const payload = JSON.stringify({
    scope: 'homeApi',
    event,
    ...metadata,
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.info(payload);
}

homeRouter.get('/', async (_req, res) => {
  try {
    const dashboard = await getHomeDashboard();
    logApiEvent('info', 'home-dashboard-succeeded', {
      todayDueCount: dashboard.summary.todayDueCount,
      activityCount: dashboard.recentActivities.length,
      firstUse: dashboard.state.firstUse,
      noReviewToday: dashboard.state.noReviewToday,
    });
    return res.json(dashboard);
  } catch (error) {
    logApiEvent('error', 'home-dashboard-failed', {
      message: error instanceof Error ? error.message : 'unknown error',
    });
    return res.status(503).json({ error: 'home_temporary_failure' });
  }
});