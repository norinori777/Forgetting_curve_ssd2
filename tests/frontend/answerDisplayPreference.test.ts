import { describe, expect, it, vi } from 'vitest';

import {
  ANSWER_DISPLAY_MODE_STORAGE_KEY,
  getAnswerDisplayMode,
  normalizeAnswerDisplayMode,
} from '../../frontend/src/services/answerDisplayPreference';

describe('answerDisplayPreference', () => {
  it('normalizes known values and falls back to link', () => {
    expect(normalizeAnswerDisplayMode('inline')).toBe('inline');
    expect(normalizeAnswerDisplayMode('link')).toBe('link');
    expect(normalizeAnswerDisplayMode('unexpected')).toBe('link');
    expect(normalizeAnswerDisplayMode(null)).toBe('link');
  });

  it('reads local storage values and falls back on invalid values', () => {
    const storage = {
      getItem: vi.fn((key: string) => (key === ANSWER_DISPLAY_MODE_STORAGE_KEY ? 'inline' : null)),
    };

    expect(getAnswerDisplayMode(storage)).toBe('inline');

    storage.getItem.mockReturnValueOnce('invalid');
    expect(getAnswerDisplayMode(storage)).toBe('link');
  });

  it('falls back to link when storage access throws', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('blocked');
      }),
    };

    expect(getAnswerDisplayMode(storage)).toBe('link');
  });
});