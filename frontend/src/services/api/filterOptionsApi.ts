import type { FilterOption } from '../../domain/cardList';

async function fetchOptions(endpoint: '/api/tags' | '/api/collections', q = ''): Promise<FilterOption[]> {
  const params = new URLSearchParams();
  if (q.trim().length > 0) params.set('q', q.trim());
  params.set('limit', '20');

  const res = await fetch(`${endpoint}?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { items?: FilterOption[] };
  return data.items ?? [];
}

export function fetchTagOptions(q = ''): Promise<FilterOption[]> {
  return fetchOptions('/api/tags', q);
}

export function fetchCollectionOptions(q = ''): Promise<FilterOption[]> {
  return fetchOptions('/api/collections', q);
}