import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { App } from '../../frontend/src/App';

describe('SC-001: home screen initial render performance (synthetic)', () => {
  it('renders home initial interactive state within 2s (synthetic)', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/home')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            generatedAt: '2026-03-26T10:00:00.000Z',
            summary: { todayDueCount: 3, overdueCount: 1, unlearnedCount: 2, streakDays: 4 },
            recentActivities: [],
            state: { firstUse: false, noReviewToday: false },
          }),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [], nextCursor: undefined }),
      };
    });

    // @ts-expect-error testing stub
    vi.stubGlobal('fetch', fetchMock);

    const start = performance.now();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'ホーム' });
    await screen.findByTestId('home-summary-today');
    const end = performance.now();

    expect(end - start).toBeLessThan(2000);
  });
});