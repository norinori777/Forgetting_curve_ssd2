import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../../frontend/src/App';
import { CardList } from '../../frontend/src/pages/CardList';

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

describe('CardList states', () => {
  function renderCardList() {
    return render(
      <MemoryRouter>
        <CardList />
      </MemoryRouter>,
    );
  }

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows empty state and reset action', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/home')) {
          return new Response(
            JSON.stringify({
              generatedAt: '2026-03-26T10:00:00.000Z',
              summary: { todayDueCount: 0, overdueCount: 0, unlearnedCount: 0, streakDays: 0 },
              recentActivities: [],
              state: { firstUse: false, noReviewToday: true },
            }),
            { status: 200 },
          );
        }
        if (url.includes('/api/cards')) {
          return new Response(JSON.stringify({ items: [], nextCursor: undefined }), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }),
    );

    renderCardList();

    expect(await screen.findByText('条件に一致するカードがありません。')).toBeInTheDocument();
    const [cardList] = screen.getAllByRole('region', { name: 'card-list' });
    expect(within(cardList).getByRole('button', { name: '条件をリセット' })).toBeInTheDocument();
  });

  it('shows retry banner on initial load error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('error', { status: 500 })),
    );

    renderCardList();

    expect(await screen.findByRole('alert')).toHaveTextContent('Error: HTTP 500');
  });

  it('opens tag modal and applies selected labels', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/tags')) {
          return new Response(JSON.stringify({ items: [{ id: 'tag1', label: 'tag1' }] }), { status: 200 });
        }
        if (url.includes('/api/cards')) {
          return new Response(JSON.stringify({ items: [], nextCursor: undefined }), { status: 200 });
        }
        if (url.includes('/api/collections')) {
          return new Response(JSON.stringify({ items: [] }), { status: 200 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      }),
    );

    renderCardList();

    const [filterSection] = screen.getAllByRole('region', { name: 'filters' });
    const openTagButton = await within(filterSection).findByRole('button', { name: 'タグ/コレクションを選択' });
    await user.click(openTagButton);
    const optionList = await screen.findByLabelText('shared-tag-options');
    await user.click(within(optionList).getByText('tag1'));
    await user.click(screen.getByRole('button', { name: '適用' }));

    await waitFor(() => {
      expect(screen.getByText('タグ: tag1')).toBeInTheDocument();
    });
  });

  it('renders /cards within the shared layout without a breadcrumb region', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cards')) {
          return new Response(JSON.stringify({ items: [], nextCursor: undefined }), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }),
    );

    render(
      <MemoryRouter initialEntries={['/cards']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'カード一覧' })).toBeInTheDocument();
    expect(screen.queryByLabelText('パンくず')).not.toBeInTheDocument();
    expect(within(screen.getByLabelText('トップレベルナビゲーション')).queryByRole('link', { name: 'ホーム', exact: true })).not.toBeInTheDocument();
  });

  it('navigates to create page from header and cards list CTA', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cards')) {
          return new Response(JSON.stringify({ items: [], nextCursor: undefined }), { status: 200 });
        }
        if (url.includes('/api/collections')) {
          return new Response(JSON.stringify({ items: [{ id: 'col1', label: 'TOEIC 600' }] }), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }),
    );

    render(
      <MemoryRouter initialEntries={['/cards']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'カード一覧' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: '学習カード登録' }));
    expect(await screen.findByRole('heading', { name: '学習カード登録' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '一覧へ戻る' }));
    expect(await screen.findByRole('heading', { name: 'カード一覧' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: '新規カード' }));
    expect(await screen.findByRole('heading', { name: '学習カード登録' })).toBeInTheDocument();
  });

  it('supports keyboard focus to search and clears selection when filters change', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cards')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: 'c1',
                  title: 'Card 1',
                  content: 'one',
                  answer: null,
                  tags: [],
                  collectionId: null,
                  proficiency: 0,
                  nextReviewAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
                  lastCorrectRate: 0,
                  isArchived: false,
                  createdAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                  updatedAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                },
              ],
              nextCursor: undefined,
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }),
    );

    renderCardList();

    await screen.findByRole('heading', { name: 'Card 1' });

    await user.keyboard('{Control>}f{/Control}');
    expect(screen.getByLabelText('検索')).toHaveFocus();

    await user.click(screen.getByLabelText('選択: Card 1'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');

    await user.selectOptions(screen.getByLabelText('ステータス'), 'today');

    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    });
  });

  it('starts review from current filter and shows over-limit notice after navigation', async () => {
    const user = userEvent.setup();
    const snapshot = {
      sessionId: 's-cap',
      status: 'in_progress',
      currentIndex: 0,
      totalCount: 200,
      remainingCount: 200,
      canGoPrev: false,
      canGoNext: false,
      filterSummary: {
        q: null,
        filter: null,
        sort: 'next_review_at',
        tagLabels: [],
        collectionLabels: [],
        targetResolution: {
          matchedCount: 205,
          includedCount: 200,
          excludedCount: 5,
          exclusionBreakdown: [{ reason: 'over_limit', count: 5 }],
        },
      },
      currentCard: {
        cardId: 'c1',
        title: 'Card 1',
        content: 'question one',
        answer: 'answer one',
        tags: [],
        collectionLabel: null,
        nextReviewAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
        reviewReason: {
          label: '開始条件に一致したため復習対象です',
          detail: null,
          source: 'filter_match',
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
        totalCount: 200,
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('/api/cards')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: 'c1',
                  title: 'Card 1',
                  content: 'question one',
                  answer: 'answer one',
                  tags: [],
                  collectionId: null,
                  proficiency: 0,
                  nextReviewAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
                  lastCorrectRate: 0,
                  isArchived: false,
                  createdAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                  updatedAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                },
              ],
              nextCursor: undefined,
            }),
            { status: 200 },
          );
        }
        if (url.includes('/api/review/start') && init?.method === 'POST') {
          return new Response(JSON.stringify({ snapshot }), { status: 200 });
        }
        if (url.includes('/api/review/sessions/s-cap') && !init?.method) {
          return new Response(JSON.stringify(snapshot), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }),
    );

    render(
      <MemoryRouter initialEntries={['/cards']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Card 1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '復習開始' }));

    expect(await screen.findByRole('heading', { name: '復習' })).toBeInTheDocument();
    expect(screen.getByText('除外 5 件（上限超過 5 件）')).toBeInTheDocument();
  });

  it('shows answer links per card and toggles only the selected card', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cards')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: 'c1',
                  title: 'Card 1',
                  content: 'question one',
                  answer: 'answer one',
                  tags: [],
                  collectionId: null,
                  proficiency: 0,
                  nextReviewAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
                  lastCorrectRate: 0,
                  isArchived: false,
                  createdAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                  updatedAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                },
                {
                  id: 'c2',
                  title: 'Card 2',
                  content: 'question two',
                  answer: 'answer two',
                  tags: [],
                  collectionId: null,
                  proficiency: 1,
                  nextReviewAt: new Date('2026-03-08T00:00:00.000Z').toISOString(),
                  lastCorrectRate: 0.2,
                  isArchived: false,
                  createdAt: new Date('2026-03-02T00:00:00.000Z').toISOString(),
                  updatedAt: new Date('2026-03-02T00:00:00.000Z').toISOString(),
                },
              ],
              nextCursor: undefined,
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }),
    );

    window.localStorage.setItem('fc.cardList.answerDisplayMode', 'link');

    renderCardList();

    expect(await screen.findAllByRole('button', { name: '回答を表示' })).toHaveLength(2);

    const firstCard = screen.getByRole('heading', { name: 'Card 1' }).closest('article');
    const secondCard = screen.getByRole('heading', { name: 'Card 2' }).closest('article');

    await user.click(within(firstCard!).getByRole('button', { name: '回答を表示' }));

    expect(within(firstCard!).getByText('answer one')).toBeInTheDocument();
    expect(within(secondCard!).queryByText('answer two')).not.toBeInTheDocument();
    expect(within(secondCard!).getByRole('button', { name: '回答を表示' })).toBeInTheDocument();
  });

  it('shows unanswered labels and answer-search results', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cards')) {
          const query = new URL(url, 'http://localhost').searchParams.get('q') ?? '';
          const items =
            query === 'keyword'
              ? [
                  {
                    id: 'c1',
                    title: 'Answer Match',
                    content: 'question',
                    answer: 'contains keyword',
                    tags: [],
                    collectionId: null,
                    proficiency: 0,
                    nextReviewAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
                    lastCorrectRate: 0,
                    isArchived: false,
                    createdAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                    updatedAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                  },
                ]
              : [
                  {
                    id: 'c2',
                    title: 'No Answer',
                    content: 'question',
                    answer: null,
                    tags: [],
                    collectionId: null,
                    proficiency: 0,
                    nextReviewAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
                    lastCorrectRate: 0,
                    isArchived: false,
                    createdAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                    updatedAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                  },
                ];

          return new Response(JSON.stringify({ items, nextCursor: undefined }), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }),
    );

    renderCardList();

    expect(await screen.findByText('未登録')).toBeInTheDocument();

    const search = screen.getByLabelText('検索');
    await user.type(search, 'keyword');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Answer Match' })).toBeInTheDocument();
    });
  });

  it('uses inline and fallback answer display modes on initial render', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cards')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  id: 'c1',
                  title: 'Inline Card',
                  content: 'question',
                  answer: 'inline answer',
                  tags: [],
                  collectionId: null,
                  proficiency: 0,
                  nextReviewAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
                  lastCorrectRate: 0,
                  isArchived: false,
                  createdAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                  updatedAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
                },
              ],
              nextCursor: undefined,
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }),
    );

    window.localStorage.setItem('fc.cardList.answerDisplayMode', 'inline');
    const { unmount } = renderCardList();

    expect(await screen.findByText('inline answer')).toBeInTheDocument();
    unmount();

    window.localStorage.setItem('fc.cardList.answerDisplayMode', 'invalid');
    renderCardList();

    expect(await screen.findByRole('button', { name: '回答を表示' })).toBeInTheDocument();
  });
});