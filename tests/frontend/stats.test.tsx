import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../../frontend/src/App';

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

function buildHomeDashboard() {
  return {
    generatedAt: '2026-03-28T10:00:00.000Z',
    summary: {
      todayDueCount: 2,
      overdueCount: 0,
      unlearnedCount: 1,
      streakDays: 4,
    },
    recentActivities: [],
    state: {
      firstUse: false,
      noReviewToday: false,
    },
  };
}

function buildStatsDashboard(overrides: Record<string, unknown> = {}) {
  return {
    generatedAt: '2026-03-28T12:00:00.000Z',
    selectedRange: '7d',
    summary: {
      totalCardCount: { value: 248, deltaFromPrevious: 12, unit: 'count', displayHint: '前期間比 +12' },
      completedReviewCount: { value: 64, deltaFromPrevious: 8, unit: 'count', displayHint: '前期間比 +8' },
      averageAccuracy: { value: 86, deltaFromPrevious: 4, unit: 'percent', displayHint: '前期間比 +4pt' },
      streakDays: { value: 12, deltaFromPrevious: null, unit: 'days', bestRecordDays: 18, displayHint: '最高記録 18日' },
    },
    volumeTrend: {
      metric: 'completed_reviews',
      bucketUnit: 'day',
      points: [
        { key: '1', label: '3/22', value: 4, from: '2026-03-22T00:00:00.000Z', to: '2026-03-22T23:59:59.999Z' },
        { key: '2', label: '3/23', value: 6, from: '2026-03-23T00:00:00.000Z', to: '2026-03-23T23:59:59.999Z' },
      ],
    },
    accuracyTrend: {
      metric: 'average_accuracy',
      bucketUnit: 'day',
      points: [
        { key: '1', label: '3/22', value: 82, from: '2026-03-22T00:00:00.000Z', to: '2026-03-22T23:59:59.999Z' },
        { key: '2', label: '3/23', value: 86, from: '2026-03-23T00:00:00.000Z', to: '2026-03-23T23:59:59.999Z' },
      ],
    },
    tagBreakdown: [
      { tagId: 't1', tagName: '語彙', reviewCount: 72, averageAccuracy: 88, isWeakest: false },
      { tagId: 't2', tagName: '文法', reviewCount: 41, averageAccuracy: 79, isWeakest: false },
      { tagId: 't3', tagName: 'リスニング', reviewCount: 23, averageAccuracy: 74, isWeakest: true },
    ],
    insights: [
      { id: 'trend-overview', kind: 'trend', message: 'レビュー完了数は前期間より 8 件増えています。', relatedTagId: null },
      { id: 'focus-weakest-tag', kind: 'focus', message: '要改善: リスニング（正答率 74%）', relatedTagId: 't3' },
    ],
    state: { mode: 'ready', unavailableSections: [], message: null },
    ...overrides,
  };
}

function renderApp(initialEntry = '/stats') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Stats page', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('navigates from the top-level nav and loads default 7d stats', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/home')) {
        return new Response(JSON.stringify(buildHomeDashboard()), { status: 200 });
      }
      if (url.endsWith('/api/stats?range=7d')) {
        return new Response(JSON.stringify(buildStatsDashboard()), { status: 200 });
      }
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    renderApp('/');

    await user.click(await screen.findByRole('link', { name: '統計' }));

    expect(await screen.findByRole('heading', { name: '統計' })).toBeInTheDocument();
    expect(await screen.findByTestId('stats-summary-total-cards')).toHaveTextContent('248');
    expect(fetchMock).toHaveBeenCalledWith('/api/stats?range=7d');

    await user.click(screen.getByRole('link', { name: 'ホームへ移動' }));
    expect(await screen.findByRole('heading', { name: 'ホーム' })).toBeInTheDocument();
  });

  it('switches range tabs and updates the rendered trends', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/stats?range=7d')) {
          return new Response(JSON.stringify(buildStatsDashboard()), { status: 200 });
        }
        if (url.endsWith('/api/stats?range=30d')) {
          return new Response(
            JSON.stringify(
              buildStatsDashboard({
                selectedRange: '30d',
                volumeTrend: {
                  metric: 'completed_reviews',
                  bucketUnit: 'day',
                  points: [{ key: 'x', label: '3/01', value: 12, from: '2026-03-01T00:00:00.000Z', to: '2026-03-01T23:59:59.999Z' }],
                },
              }),
            ),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify(buildHomeDashboard()), { status: 200 });
      }),
    );

    renderApp('/stats');

    await user.click(await screen.findByRole('tab', { name: '30日間' }));
    expect(await screen.findByText('3/01')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '30日間' })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows empty-state CTAs and allows keyboard focus to reach them', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/stats?range=7d')) {
          return new Response(
            JSON.stringify(
              buildStatsDashboard({
                summary: {
                  totalCardCount: { value: 12, deltaFromPrevious: 1, unit: 'count', displayHint: '前期間比 +1' },
                  completedReviewCount: { value: 0, deltaFromPrevious: -2, unit: 'count', displayHint: '前期間比 -2' },
                  averageAccuracy: null,
                  streakDays: { value: 0, deltaFromPrevious: null, unit: 'days', bestRecordDays: 2, displayHint: '最高記録 2日' },
                },
                volumeTrend: { metric: 'completed_reviews', bucketUnit: 'day', points: [] },
                accuracyTrend: null,
                tagBreakdown: [],
                insights: [],
                state: {
                  mode: 'empty',
                  unavailableSections: [],
                  message: 'まずはカードを追加して復習を始めると、ここに推移と内訳が表示されます。',
                },
              }),
            ),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify(buildHomeDashboard()), { status: 200 });
      }),
    );

    renderApp('/stats');

    expect(await screen.findByText('まだ統計を表示できるだけの学習履歴がありません')).toBeInTheDocument();
    const createLink = screen.getByRole('link', { name: '学習カードを追加' });
    const reviewLink = screen.getByRole('link', { name: '復習画面を見る' });
    expect(createLink).toHaveAttribute('href', '/cards/create');
    expect(reviewLink).toHaveAttribute('href', '/review');

    for (let index = 0; index < 16 && document.activeElement !== createLink; index += 1) {
      await user.tab();
    }

    await waitFor(() => expect(createLink).toHaveFocus());
  });

  it('renders cached fallback when the stats fetch fails', async () => {
    window.localStorage.setItem(
      'fc.stats.cachedDashboard:7d',
      JSON.stringify({ range: '7d', snapshot: buildStatsDashboard(), cachedAt: '2026-03-28T12:00:00.000Z' }),
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/stats?range=7d')) {
          return new Response(JSON.stringify({ error: 'stats_temporary_failure' }), { status: 503 });
        }
        return new Response(JSON.stringify(buildHomeDashboard()), { status: 200 });
      }),
    );

    renderApp('/stats');

    expect(await screen.findByText('最新の統計を取得できなかったため、前回取得した統計を表示しています。')).toBeInTheDocument();
    expect(screen.getByText('キャッシュ表示')).toBeInTheDocument();
    expect(screen.getByTestId('stats-summary-total-cards')).toHaveTextContent('248');
  });
});