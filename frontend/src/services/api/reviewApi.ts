import type { CardListFilter, ReviewStartResponse } from '../../domain/cardList';

export async function startReview(filter: CardListFilter): Promise<ReviewStartResponse> {
  const res = await fetch('/api/review/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ filter }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return (await res.json()) as ReviewStartResponse;
}