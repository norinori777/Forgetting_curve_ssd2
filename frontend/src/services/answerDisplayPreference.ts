import type { AnswerDisplayMode } from '../domain/cardList';

export const ANSWER_DISPLAY_MODE_STORAGE_KEY = 'fc.cardList.answerDisplayMode';

export function normalizeAnswerDisplayMode(value: unknown): AnswerDisplayMode {
  return value === 'inline' ? 'inline' : 'link';
}

export function getAnswerDisplayMode(storage: Pick<Storage, 'getItem'> | null | undefined = typeof window !== 'undefined' ? window.localStorage : undefined): AnswerDisplayMode {
  if (!storage) return 'link';

  try {
    return normalizeAnswerDisplayMode(storage.getItem(ANSWER_DISPLAY_MODE_STORAGE_KEY));
  } catch {
    return 'link';
  }
}