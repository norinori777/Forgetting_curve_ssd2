import type { CreateCardErrorResponse, CreateCardRequest, CreateCardResponse } from '../../domain/cardCreate';

export class CreateCardApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: CreateCardErrorResponse,
  ) {
    super(message);
  }
}

export async function createCard(payload: CreateCardRequest): Promise<CreateCardResponse> {
  const res = await fetch('/api/cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => undefined)) as CreateCardResponse | CreateCardErrorResponse | undefined;

  if (!res.ok) {
    const body = (data ?? { error: 'database_error' }) as CreateCardErrorResponse;
    throw new CreateCardApiError(body.message ?? `HTTP ${res.status}`, res.status, body);
  }

  return data as CreateCardResponse;
}