import type { CachedStatisticsDashboard, StatisticsDashboardResponse, StatisticsRange } from '../domain/stats';

const CACHE_PREFIX = 'fc.stats.cachedDashboard:';

function getStorage(storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined): Storage | undefined {
  return storage;
}

function readJson<T>(key: string, storage?: Storage): T | null {
  const target = getStorage(storage);
  if (!target) return null;
  const raw = target.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown, storage?: Storage): void {
  const target = getStorage(storage);
  if (!target) return;
  target.setItem(key, JSON.stringify(value));
}

export function cacheStatsDashboard(snapshot: StatisticsDashboardResponse, storage?: Storage): void {
  writeJson(`${CACHE_PREFIX}${snapshot.selectedRange}`, { range: snapshot.selectedRange, snapshot, cachedAt: new Date().toISOString() } satisfies CachedStatisticsDashboard, storage);
}

export function getCachedStatsDashboard(range: StatisticsRange, storage?: Storage): CachedStatisticsDashboard | null {
  return readJson<CachedStatisticsDashboard>(`${CACHE_PREFIX}${range}`, storage);
}

export function clearCachedStatsDashboard(range: StatisticsRange, storage?: Storage): void {
  getStorage(storage)?.removeItem(`${CACHE_PREFIX}${range}`);
}