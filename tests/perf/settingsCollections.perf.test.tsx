import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { App } from '../../frontend/src/App';

describe('settings collections performance (synthetic)', () => {
  it('renders the settings collection management screen within 2s (synthetic)', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/collections/manage')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 'collection-1',
                name: 'Perf Collection',
                description: 'Synthetic sample',
                cardCount: 0,
                updatedAt: '2026-03-28T09:00:00.000Z',
                canDelete: true,
                deleteBlockedReason: null,
              },
            ],
          }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      };
    });

    // @ts-expect-error testing stub
    vi.stubGlobal('fetch', fetchMock);

    const start = performance.now();
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '設定' });
    await screen.findByText('Perf Collection');
    const end = performance.now();

    expect(end - start).toBeLessThan(2000);
  });
});