import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../../frontend/src/App';
import type { CardListFilter } from '../../frontend/src/domain/cardList';
import type { PendingReviewAssessment, ReviewSessionSnapshot } from '../../frontend/src/domain/review';
import {
  cacheReviewSessionSnapshot,
  setPendingReviewAssessment,
} from '../../frontend/src/utils/reviewSessionStorage';

function buildSnapshot(overrides: Partial<ReviewSessionSnapshot> = {}): ReviewSessionSnapshot {
  return {
    sessionId: 's1',
    status: 'in_progress',
    currentIndex: 0,
    totalCount: 2,
    remainingCount: 2,
    canGoPrev: false,
    canGoNext: false,
    filterSummary: {
      q: null,
      filter: 'today',
      sort: 'next_review_at',
      tagLabels: ['tag1'],
      collectionLabels: ['TOEIC'],
    },
    currentCard: {
      cardId: 'c1',
      title: 'Card 1',
      content: 'question one',
      answer: 'answer one',
      tags: ['tag1'],
      collectionLabel: 'TOEIC',
      nextReviewAt: '2026-03-07T00:00:00.000Z',
      reviewReason: {
        label: '今日の復習対象に含まれています',
        detail: '2026-03-07T00:00:00.000Z',
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
      totalCount: 2,
    },
    ...overrides,
  };
}

function renderReview(initialEntry = '/review?sessionId=s1') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Review page', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('loads one-card review loop and blocks next until assessment exists', async () => {
    const user = userEvent.setup();
    const initialSnapshot = buildSnapshot();
    const assessedSnapshot = buildSnapshot({
      canGoNext: true,
      currentCard: { ...initialSnapshot.currentCard!, currentAssessment: 'remembered' },
      summary: { ...initialSnapshot.summary, rememberedCount: 1, assessedCount: 1 },
      remainingCount: 1,
    });
    const secondSnapshot = buildSnapshot({
      currentIndex: 1,
      canGoPrev: true,
      canGoNext: false,
      currentCard: {
        ...initialSnapshot.currentCard!,
        cardId: 'c2',
        title: 'Card 2',
        content: 'question two',
        answer: 'answer two',
        currentAssessment: null,
      },
      remainingCount: 1,
      summary: { ...initialSnapshot.summary, rememberedCount: 1, assessedCount: 1 },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/api/review/sessions/s1') && !init?.method) {
          return new Response(JSON.stringify(initialSnapshot), { status: 200 });
        }
        if (url.endsWith('/api/review/sessions/s1/assessment')) {
          return new Response(JSON.stringify(assessedSnapshot), { status: 200 });
        }
        if (url.endsWith('/api/review/sessions/s1/navigation')) {
          return new Response(JSON.stringify(secondSnapshot), { status: 200 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      }),
    );

    renderReview();

    expect(await screen.findByRole('heading', { name: 'Card 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次へ' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '回答を表示' }));
    expect(screen.getByText('answer one')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /3\s+思い出せた/ }));
    await waitFor(() => expect(screen.getByRole('button', { name: '次へ' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: '次へ' }));
    expect(await screen.findByRole('heading', { name: 'Card 2' })).toBeInTheDocument();
  });

  it('supports keyboard shortcuts and shows review reason plus session identifier', async () => {
    const user = userEvent.setup();
    const initialSnapshot = buildSnapshot();
    const assessedSnapshot = buildSnapshot({
      canGoNext: true,
      currentCard: { ...initialSnapshot.currentCard!, currentAssessment: 'uncertain' },
      remainingCount: 1,
      summary: { ...initialSnapshot.summary, uncertainCount: 1, assessedCount: 1 },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/api/review/sessions/s1') && !init?.method) {
          return new Response(JSON.stringify(initialSnapshot), { status: 200 });
        }
        if (url.endsWith('/api/review/sessions/s1/assessment')) {
          return new Response(JSON.stringify(assessedSnapshot), { status: 200 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      }),
    );

    renderReview();

    expect(await screen.findByTestId('review-session-identifier')).toHaveTextContent('s1');
    expect(screen.getByTestId('review-reason-label')).toHaveTextContent('今日の復習対象に含まれています');

    await user.keyboard('v');
    expect(screen.getByText('answer one')).toBeInTheDocument();

    await user.keyboard('2');
    await waitFor(() => expect(screen.getByRole('button', { name: '次へ' })).toBeEnabled());
  });

  it('shows cached snapshot fallback and retries pending assessment resend', async () => {
    const user = userEvent.setup();
    const cachedSnapshot = buildSnapshot({
      currentCard: { ...buildSnapshot().currentCard!, currentAssessment: 'perfect' },
      canGoNext: true,
    });

    cacheReviewSessionSnapshot(cachedSnapshot);
    setPendingReviewAssessment({
      sessionId: 's1',
      cardId: 'c1',
      assessment: 'perfect',
      queuedAt: new Date().toISOString(),
      basedOnIndex: 0,
    } satisfies PendingReviewAssessment);

    let firstGet = true;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/api/review/sessions/s1') && !init?.method) {
          if (firstGet) {
            firstGet = false;
            return new Response(JSON.stringify({ error: 'review_temporary_failure' }), { status: 503 });
          }
          return new Response(JSON.stringify(cachedSnapshot), { status: 200 });
        }
        if (url.endsWith('/api/review/sessions/s1/assessment')) {
          return new Response(JSON.stringify(cachedSnapshot), { status: 200 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      }),
    );

    renderReview();

    expect(await screen.findByText('question one')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('通信に失敗したため、最後に取得した内容を表示しています。');

    await user.click(screen.getByRole('button', { name: '再試行' }));
    expect(await screen.findByRole('status')).toHaveTextContent('未同期の評価を再送しました。');
  });

  it('shows completed summary', async () => {
    const completedSnapshot = buildSnapshot({
      status: 'completed',
      currentIndex: 2,
      canGoPrev: false,
      canGoNext: false,
      currentCard: null,
      summary: {
        forgotCount: 1,
        uncertainCount: 0,
        rememberedCount: 1,
        perfectCount: 0,
        assessedCount: 2,
        totalCount: 2,
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(completedSnapshot), { status: 200 })),
    );

    renderReview();

    expect(await screen.findByRole('heading', { name: '今回の復習が完了しました' })).toBeInTheDocument();
    expect(screen.queryByText('1 / 2 件の評価を記録しました。')).not.toBeInTheDocument();
    expect(screen.getByText('2 / 2 件の評価を記録しました。')).toBeInTheDocument();
  });

  it('retries review start from stored filter when entering start-error state', async () => {
    const user = userEvent.setup();
    const filter: CardListFilter = { sort: 'next_review_at', tagIds: [], collectionIds: [], filter: 'today' };
    window.localStorage.setItem('fc.review.startFilter', JSON.stringify(filter));
    const startedSnapshot = buildSnapshot();

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/api/review/start') && init?.method === 'POST') {
          return new Response(JSON.stringify({ snapshot: startedSnapshot }), { status: 200 });
        }
        if (url.endsWith('/api/review/sessions/s1') && !init?.method) {
          return new Response(JSON.stringify(startedSnapshot), { status: 200 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      }),
    );

    renderReview('/review?state=start-error');

    expect(await screen.findByText('復習の開始に失敗しました。')).toBeInTheDocument();
    const retryAlert = screen.getByRole('alert');
    await user.click(within(retryAlert).getByRole('button', { name: '再試行' }));

    expect(await screen.findByRole('heading', { name: 'Card 1' })).toBeInTheDocument();
  });
});