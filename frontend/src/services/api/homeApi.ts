import type { HomeDashboardResponse } from '../../domain/home';

export class HomeApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new HomeApiError(res.status, message);
  }

  return (await res.json()) as T;
}

export async function fetchHomeDashboard(): Promise<HomeDashboardResponse> {
  const res = await fetch('/api/home');
  return parseResponse<HomeDashboardResponse>(res);
}