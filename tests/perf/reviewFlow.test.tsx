import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { App } from '../../frontend/src/App';

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

function buildSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 's-perf',
    status: 'in_progress',
    currentIndex: 0,
    totalCount: 200,
    remainingCount: 200,
    canGoPrev: false,
    canGoNext: false,
    filterSummary: {
      q: null,
      filter: 'today',
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
      title: 'Perf Card 1',
      content: 'question one',
      answer: 'answer one',
      tags: [],
      collectionLabel: null,
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
      totalCount: 200,
    },
    ...overrides,
  };
}

describe('review performance (synthetic)', () => {
  it('starts review within 500ms and keeps over-limit notice visible', async () => {
    const user = userEvent.setup();
    const snapshot = buildSnapshot();

    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
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
                  title: 'Perf Card 1',
                  content: 'question one',
                  answer: 'answer one',
                  tags: [],
                  collectionId: null,
                  proficiency: 0,
                  nextReviewAt: '2026-03-07T00:00:00.000Z',
                  lastCorrectRate: 0,
                  isArchived: false,
                  createdAt: '2026-03-01T00:00:00.000Z',
                  updatedAt: '2026-03-01T00:00:00.000Z',
                },
              ],
              nextCursor: undefined,
            }),
            { status: 200 },
          );
        }
        if (url.endsWith('/api/review/start') && init?.method === 'POST') {
          return new Response(JSON.stringify({ snapshot }), { status: 200 });
        }
        if (url.endsWith('/api/review/sessions/s-perf') && !init?.method) {
          return new Response(JSON.stringify(snapshot), { status: 200 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      }),
    );

    render(
      <MemoryRouter initialEntries={['/cards']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Perf Card 1' });
    const start = performance.now();
    await user.click(screen.getByRole('button', { name: '復習開始' }));
    await screen.findByRole('heading', { name: '復習' });
    const end = performance.now();

    expect(end - start).toBeLessThan(500);
    expect(screen.getByText('除外 5 件（上限超過 5 件）')).toBeInTheDocument();
  });

  it('moves to the next review card within 100ms after assessment (synthetic)', async () => {
    const user = userEvent.setup();
    const first = buildSnapshot();
    const afterAssessment = buildSnapshot({
      canGoNext: true,
      currentCard: { ...first.currentCard, currentAssessment: 'remembered' },
      remainingCount: 199,
      summary: { ...first.summary, rememberedCount: 1, assessedCount: 1 },
    });
    const second = buildSnapshot({
      currentIndex: 1,
      canGoPrev: true,
      currentCard: { ...first.currentCard, cardId: 'c2', title: 'Perf Card 2', content: 'question two', answer: 'answer two' },
      remainingCount: 199,
      summary: { ...first.summary, rememberedCount: 1, assessedCount: 1 },
    });

    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/api/review/sessions/s-perf') && !init?.method) {
          return new Response(JSON.stringify(first), { status: 200 });
        }
        if (url.endsWith('/api/review/sessions/s-perf/assessment')) {
          return new Response(JSON.stringify(afterAssessment), { status: 200 });
        }
        if (url.endsWith('/api/review/sessions/s-perf/navigation')) {
          return new Response(JSON.stringify(second), { status: 200 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      }),
    );

    render(
      <MemoryRouter initialEntries={['/review?sessionId=s-perf']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Perf Card 1' });
    const [revealAnswerButton] = screen.getAllByRole('button', { name: '回答を表示' });
    await user.click(revealAnswerButton);
    const rememberedButtons = screen.getAllByRole('button', { name: /3\s+思い出せた/ });
    await user.click(rememberedButtons.find((button) => !button.hasAttribute('disabled')) ?? rememberedButtons[0]);
    await waitFor(() => {
      const nextButtons = screen.getAllByRole('button', { name: '次へ' });
      expect(nextButtons.some((button) => !button.hasAttribute('disabled'))).toBe(true);
    });

    const start = performance.now();
    const nextButtons = screen.getAllByRole('button', { name: '次へ' });
    await user.click(nextButtons.find((button) => !button.hasAttribute('disabled')) ?? nextButtons[0]);
    await screen.findByRole('heading', { name: 'Perf Card 2' });
    const end = performance.now();

    expect(end - start).toBeLessThan(100);
  });
});
