import type { ReviewViewState } from '../../domain/review';

export function buildReviewSessionPath(options: { sessionId?: string; state?: ReviewViewState | null } = {}): string {
  const params = new URLSearchParams();
  if (options.sessionId) params.set('sessionId', options.sessionId);
  if (options.state) params.set('state', options.state);
  const query = params.toString();
  return query.length > 0 ? `/review?${query}` : '/review';
}

export function getReviewSessionIdFromSearch(search: string): string | null {
  return new URLSearchParams(search).get('sessionId');
}

export function getReviewViewStateFromSearch(search: string): ReviewViewState | null {
  const value = new URLSearchParams(search).get('state');
  return value === 'empty' || value === 'start-error' ? value : null;
}