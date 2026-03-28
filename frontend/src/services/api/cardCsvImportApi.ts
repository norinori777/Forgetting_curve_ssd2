import type {
  CardCsvImportErrorResponse,
  ImportCardsRequest,
  ImportCardsResponse,
  ValidateCardImportRequest,
  ValidateCardImportResponse,
} from '../../domain/cardCsvImport';

export class CardCsvImportApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: CardCsvImportErrorResponse,
  ) {
    super(message);
  }
}

async function parseResponse<TSuccess>(res: Response): Promise<TSuccess> {
  return (await res.json().catch(() => undefined)) as TSuccess;
}

export async function validateCardCsvImport(payload: ValidateCardImportRequest): Promise<ValidateCardImportResponse> {
  const res = await fetch('/api/cards/import/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse<ValidateCardImportResponse | CardCsvImportErrorResponse>(res);
  if (!res.ok) {
    const body = (data ?? { error: 'database_error' }) as CardCsvImportErrorResponse;
    throw new CardCsvImportApiError(body.message ?? `HTTP ${res.status}`, res.status, body);
  }

  return data as ValidateCardImportResponse;
}

export async function importCardsFromCsv(payload: ImportCardsRequest): Promise<ImportCardsResponse> {
  const res = await fetch('/api/cards/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse<ImportCardsResponse | CardCsvImportErrorResponse>(res);
  if (!res.ok) {
    const body = (data ?? { error: 'database_error' }) as CardCsvImportErrorResponse;
    throw new CardCsvImportApiError(body.message ?? `HTTP ${res.status}`, res.status, body);
  }

  return data as ImportCardsResponse;
}