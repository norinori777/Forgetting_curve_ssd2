import type { CardListFilter } from '../domain/cardList';
import type { CachedReviewSessionSnapshot, PendingReviewAssessment, ReviewSessionSnapshot } from '../domain/review';

const ACTIVE_SESSION_KEY = 'fc.review.activeSessionId';
const START_FILTER_KEY = 'fc.review.startFilter';
const SNAPSHOT_PREFIX = 'fc.review.cachedSnapshot:';
const PENDING_PREFIX = 'fc.review.pendingAssessment:';

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

export function getActiveReviewSessionId(storage?: Storage): string | null {
  return getStorage(storage)?.getItem(ACTIVE_SESSION_KEY) ?? null;
}

export function setActiveReviewSessionId(sessionId: string, storage?: Storage): void {
  getStorage(storage)?.setItem(ACTIVE_SESSION_KEY, sessionId);
}

export function clearActiveReviewSessionId(storage?: Storage): void {
  getStorage(storage)?.removeItem(ACTIVE_SESSION_KEY);
}

export function cacheReviewSessionSnapshot(snapshot: ReviewSessionSnapshot, storage?: Storage): void {
  writeJson(`${SNAPSHOT_PREFIX}${snapshot.sessionId}`, { sessionId: snapshot.sessionId, snapshot, cachedAt: new Date().toISOString() } satisfies CachedReviewSessionSnapshot, storage);
}

export function getCachedReviewSessionSnapshot(sessionId: string, storage?: Storage): CachedReviewSessionSnapshot | null {
  return readJson<CachedReviewSessionSnapshot>(`${SNAPSHOT_PREFIX}${sessionId}`, storage);
}

export function clearCachedReviewSessionSnapshot(sessionId: string, storage?: Storage): void {
  getStorage(storage)?.removeItem(`${SNAPSHOT_PREFIX}${sessionId}`);
}

export function setPendingReviewAssessment(payload: PendingReviewAssessment, storage?: Storage): void {
  writeJson(`${PENDING_PREFIX}${payload.sessionId}`, payload, storage);
}

export function getPendingReviewAssessment(sessionId: string, storage?: Storage): PendingReviewAssessment | null {
  return readJson<PendingReviewAssessment>(`${PENDING_PREFIX}${sessionId}`, storage);
}

export function clearPendingReviewAssessment(sessionId: string, storage?: Storage): void {
  getStorage(storage)?.removeItem(`${PENDING_PREFIX}${sessionId}`);
}

export function setPendingReviewStartFilter(filter: CardListFilter, storage?: Storage): void {
  writeJson(START_FILTER_KEY, filter, storage);
}

export function getPendingReviewStartFilter(storage?: Storage): CardListFilter | null {
  return readJson<CardListFilter>(START_FILTER_KEY, storage);
}

export function clearPendingReviewStartFilter(storage?: Storage): void {
  getStorage(storage)?.removeItem(START_FILTER_KEY);
}