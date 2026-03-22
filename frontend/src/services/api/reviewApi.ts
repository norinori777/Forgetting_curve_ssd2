import type { CardListFilter } from '../../domain/cardList';
import type { ReviewNavigateDirection, ReviewSessionSnapshot, ReviewStartResponse, ReviewAssessment } from '../../domain/review';

export class ReviewApiError extends Error {
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
    throw new ReviewApiError(res.status, message);
  }

  return (await res.json()) as T;
}

export async function startReview(filter: CardListFilter): Promise<ReviewStartResponse> {
  const res = await fetch('/api/review/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ filter }),
  });

  return parseResponse<ReviewStartResponse>(res);
}

export async function getReviewSession(sessionId: string): Promise<ReviewSessionSnapshot> {
  const res = await fetch(`/api/review/sessions/${sessionId}`);
  return parseResponse<ReviewSessionSnapshot>(res);
}

export async function saveReviewAssessment(sessionId: string, payload: { cardId: string; assessment: ReviewAssessment }): Promise<ReviewSessionSnapshot> {
  const res = await fetch(`/api/review/sessions/${sessionId}/assessment`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse<ReviewSessionSnapshot>(res);
}

export async function navigateReviewSession(sessionId: string, direction: ReviewNavigateDirection): Promise<ReviewSessionSnapshot> {
  const res = await fetch(`/api/review/sessions/${sessionId}/navigation`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ direction }),
  });

  return parseResponse<ReviewSessionSnapshot>(res);
}