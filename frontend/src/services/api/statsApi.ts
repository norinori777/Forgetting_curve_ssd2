import type { StatisticsDashboardResponse, StatisticsRange } from '../../domain/stats';

export class StatsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new StatsApiError(res.status, message);
  }

  return (await res.json()) as T;
}

export async function fetchStatsDashboard(range: StatisticsRange): Promise<StatisticsDashboardResponse> {
  const res = await fetch(`/api/stats?range=${encodeURIComponent(range)}`);
  return parseResponse<StatisticsDashboardResponse>(res);
}