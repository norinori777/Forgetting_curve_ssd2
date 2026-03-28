import { Router } from 'express';

import { getStatisticsDashboard } from '../repositories/statsRepository.js';
import { statisticsDashboardResponseSchema, statisticsRangeSchema } from '../schemas/stats.js';

export const statsRouter = Router();

function logApiEvent(level: 'info' | 'error', event: string, metadata: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'test') return;

  const payload = JSON.stringify({
    scope: 'statsApi',
    event,
    ...metadata,
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.info(payload);
}

statsRouter.get('/', async (req, res) => {
  const rangeResult = statisticsRangeSchema.safeParse(req.query.range);
  if (!rangeResult.success) {
    return res.status(400).json({ error: 'invalid_stats_range' });
  }

  try {
    const dashboard = await getStatisticsDashboard(rangeResult.data);
    const payload = statisticsDashboardResponseSchema.parse(dashboard);
    logApiEvent('info', 'stats-dashboard-succeeded', {
      selectedRange: payload.selectedRange,
      completedReviewCount: payload.summary.completedReviewCount.value,
      stateMode: payload.state.mode,
      unavailableSections: payload.state.unavailableSections,
    });
    return res.json(payload);
  } catch (error) {
    logApiEvent('error', 'stats-dashboard-failed', {
      selectedRange: rangeResult.data,
      message: error instanceof Error ? error.message : 'unknown error',
    });
    return res.status(503).json({ error: 'stats_temporary_failure' });
  }
});