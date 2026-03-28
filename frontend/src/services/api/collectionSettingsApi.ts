import type {
  CollectionDeleteResponse,
  CollectionListResponse,
  CollectionMutationResponse,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from '../../domain/collectionSettings';

type ErrorCode = 'invalid_body' | 'duplicate_name' | 'not_found' | 'collection_in_use' | 'database_error';

export class CollectionSettingsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'CollectionSettingsApiError';
  }
}

async function parseResponse<T>(response: Response, fallbackCode: ErrorCode): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let code: ErrorCode = fallbackCode;
  let message: string | undefined;

  try {
    const data = (await response.json()) as { error?: ErrorCode; message?: string };
    code = data.error ?? fallbackCode;
    message = data.message;
  } catch {
    message = response.statusText;
  }

  throw new CollectionSettingsApiError(response.status, code, message);
}

export async function fetchManagedCollections(): Promise<CollectionListResponse> {
  const response = await fetch('/api/collections/manage');
  return parseResponse<CollectionListResponse>(response, 'database_error');
}

export async function createManagedCollection(request: CreateCollectionRequest): Promise<CollectionMutationResponse> {
  const response = await fetch('/api/collections/manage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return parseResponse<CollectionMutationResponse>(response, 'database_error');
}

export async function updateManagedCollection(collectionId: string, request: UpdateCollectionRequest): Promise<CollectionMutationResponse> {
  const response = await fetch(`/api/collections/manage/${collectionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return parseResponse<CollectionMutationResponse>(response, 'database_error');
}

export async function deleteManagedCollection(collectionId: string): Promise<CollectionDeleteResponse> {
  const response = await fetch(`/api/collections/manage/${collectionId}`, {
    method: 'DELETE',
  });

  return parseResponse<CollectionDeleteResponse>(response, 'database_error');
}