import type { BulkAction } from '../../domain/cardList';

type BulkResponse = Record<string, unknown> & { ok?: boolean };

export async function bulkAction(action: BulkAction, cardIds: string[], tagIds?: string[]): Promise<BulkResponse> {
  const res = await fetch('/api/cards/bulk', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, cardIds, tagIds }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return (await res.json()) as BulkResponse;
}