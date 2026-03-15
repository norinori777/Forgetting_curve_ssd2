import type { CardListFilter, ListCardsResponse } from '../../domain/cardList';

export function buildCardListParams(filter: CardListFilter, cursor?: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set('limit', '50');
  params.set('sort', filter.sort);

  if (cursor) params.set('cursor', cursor);
  if (filter.filter) params.set('filter', filter.filter);
  if (filter.q) params.set('q', filter.q);
  if (filter.tagIds.length > 0) params.set('tagIds', filter.tagIds.join(','));
  if (filter.collectionIds.length > 0) params.set('collectionIds', filter.collectionIds.join(','));

  return params;
}

export async function fetchCards(filter: CardListFilter, cursor?: string): Promise<ListCardsResponse> {
  const res = await fetch(`/api/cards?${buildCardListParams(filter, cursor).toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ListCardsResponse;
}