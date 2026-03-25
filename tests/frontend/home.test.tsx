import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../../frontend/src/App';

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

function buildDashboard(overrides: Record<string, unknown> = {}) {
  return {
    generatedAt: '2026-03-26T10:00:00.000Z',
    summary: {
      todayDueCount: 4,
      overdueCount: 1,
      unlearnedCount: 2,
      streakDays: 5,
    },
    recentActivities: [
      { id: 'a1', type: 'review_started', occurredAt: '2026-03-26T09:30:00.000Z', label: '4件の復習を開始', count: 4 },
      { id: 'a2', type: 'review_completed', occurredAt: '2026-03-26T08:30:00.000Z', label: '3件の復習を完了', count: 3 },
      { id: 'a3', type: 'card_created', occurredAt: '2026-03-25T18:00:00.000Z', label: '学習カードを追加', count: 1 },
    ],
    state: {
      firstUse: false,
      noReviewToday: false,
    },
    ...overrides,
  };
}

function buildReviewSnapshot() {
  return {
    sessionId: 's-home',
    status: 'in_progress',
    currentIndex: 0,
    totalCount: 4,
    remainingCount: 4,
    canGoPrev: false,
    canGoNext: false,
    filterSummary: {
      q: null,
      filter: 'today',
      sort: 'next_review_at',
      tagLabels: [],
      collectionLabels: [],
    },
    currentCard: {
      cardId: 'c1',
      title: 'Home Review',
      content: 'question',
      answer: 'answer',
      tags: [],
      collectionLabel: null,
      nextReviewAt: '2026-03-26T12:00:00.000Z',
      reviewReason: {
        label: '今日の復習対象に含まれています',
        detail: '2026-03-26T12:00:00.000Z',
        source: 'next_review_at',
      },
      currentAssessment: null,
      locked: false,
    },
    summary: {
      forgotCount: 0,
      uncertainCount: 0,
      rememberedCount: 0,
      perfectCount: 0,
      assessedCount: 0,
      totalCount: 4,
    },
  };
}

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Home page', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('renders the dashboard summary and recent activities', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/home')) {
          return new Response(JSON.stringify(buildDashboard()), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [], nextCursor: undefined }), { status: 200 });
      }),
    );

    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'ホーム' })).toBeInTheDocument();
    expect(screen.getByTestId('home-summary-today')).toHaveTextContent('4');
    expect(screen.getByTestId('home-summary-overdue')).toHaveTextContent('1');
    expect(screen.getByTestId('home-summary-unlearned')).toHaveTextContent('2');
    expect(screen.getByTestId('home-summary-streak')).toHaveTextContent('5');

    const list = screen.getByLabelText('recent-activities-list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('4件の復習を開始');
    expect(items[1]).toHaveTextContent('3件の復習を完了');
  });

  it('starts today review from the home CTA and navigates to review', async () => {
    const user = userEvent.setup();
    const snapshot = buildReviewSnapshot();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/api/home')) {
          return new Response(JSON.stringify(buildDashboard()), { status: 200 });
        }
        if (url.endsWith('/api/review/start')) {
          expect(init?.body).toBe(JSON.stringify({ filter: { sort: 'next_review_at', filter: 'today', tagIds: [], collectionIds: [] } }));
          return new Response(JSON.stringify({ snapshot }), { status: 200 });
        }
        if (url.endsWith('/api/review/sessions/s-home')) {
          return new Response(JSON.stringify(snapshot), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [], nextCursor: undefined }), { status: 200 });
      }),
    );

    renderApp('/');

    await user.click(await screen.findByRole('button', { name: /復習を始める/ }));
    expect(await screen.findByRole('heading', { name: 'Home Review' })).toBeInTheDocument();
  });

  it('navigates to cards, create, and settings from primary actions', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/home')) {
          return new Response(JSON.stringify(buildDashboard()), { status: 200 });
        }
        if (url.includes('/api/cards')) {
          return new Response(JSON.stringify({ items: [], nextCursor: undefined }), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }),
    );

    renderApp('/');

    await user.click(await screen.findByRole('link', { name: 'カード一覧' }));
    expect(await screen.findByRole('heading', { name: 'カード一覧' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'ホーム' }));
    await user.click(await screen.findByRole('link', { name: '学習カード登録' }));
    expect(await screen.findByRole('heading', { name: '学習カード登録' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'ホーム' }));
    await user.click(await screen.findByRole('link', { name: '設定' }));
    expect(await screen.findByRole('heading', { name: '設定' })).toBeInTheDocument();
  });

  it('shows first-use and no-review guidance panels', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(buildDashboard({ summary: { todayDueCount: 0, overdueCount: 0, unlearnedCount: 0, streakDays: 0 }, state: { firstUse: true, noReviewToday: true }, recentActivities: [] })), { status: 200 })),
    );

    renderApp('/');

    expect(await screen.findByText('最初の学習カードを登録しましょう。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /復習を始める/ })).toBeDisabled();
  });

  it('retries after home fetch failure and exposes keyboard focus to major actions', async () => {
    const user = userEvent.setup();
    let homeAttempt = 0;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/api/home')) {
          homeAttempt += 1;
          if (homeAttempt === 1) {
            return new Response(JSON.stringify({ error: 'home_temporary_failure' }), { status: 503 });
          }
          return new Response(JSON.stringify(buildDashboard()), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [], nextCursor: undefined }), { status: 200 });
      }),
    );

    renderApp('/');

    expect(await screen.findByText('ホーム情報の取得に失敗しました。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '再試行' }));
    expect(await screen.findByTestId('home-summary-today')).toHaveTextContent('4');

    const startReviewButton = screen.getByRole('button', { name: /復習を始める/ });
    for (let index = 0; index < 16 && document.activeElement !== startReviewButton; index += 1) {
      await user.tab();
    }
    await waitFor(() => expect(startReviewButton).toHaveFocus());
  });
});