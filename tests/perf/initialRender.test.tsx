import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CardList } from '../../frontend/src/pages/CardList';

describe('SC-002: initial render performance (synthetic)', () => {
  it('renders initial interactive state within 2s (synthetic)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], nextCursor: undefined }),
    });

    // @ts-expect-error testing stub
    vi.stubGlobal('fetch', fetchMock);

    const start = performance.now();
    render(<CardList />);

    await screen.findByRole('heading', { name: 'カード一覧' });
    const end = performance.now();

    expect(end - start).toBeLessThan(2000);
  });
});
