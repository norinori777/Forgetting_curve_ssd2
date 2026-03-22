import { expect, test } from '@playwright/test';

test('US1: 今日の復習 → 復習開始', async ({ page }) => {
  await page.route('**/api/cards**', async (route) => {
    const url = new URL(route.request().url());
    const filter = url.searchParams.get('filter');

    const items =
      filter === 'today'
        ? [
            {
              id: 't1',
              title: 'Today 1',
              content: 'due today',
              tags: [],
              collectionId: null,
              proficiency: 10,
              nextReviewAt: '2026-03-07T00:00:00.000Z',
              lastCorrectRate: 0.2,
              isArchived: false,
              createdAt: '2026-03-01T00:00:00.000Z',
              updatedAt: '2026-03-01T00:00:00.000Z',
            },
            {
              id: 't2',
              title: 'Today 2',
              content: 'due today',
              tags: [],
              collectionId: null,
              proficiency: 20,
              nextReviewAt: '2026-03-07T01:00:00.000Z',
              lastCorrectRate: 0.5,
              isArchived: false,
              createdAt: '2026-03-02T00:00:00.000Z',
              updatedAt: '2026-03-02T00:00:00.000Z',
            },
          ]
        : [
            {
              id: 'n1',
              title: 'Normal 1',
              content: 'not filtered',
              tags: [],
              collectionId: null,
              proficiency: 1,
              nextReviewAt: '2026-03-10T00:00:00.000Z',
              lastCorrectRate: 0.1,
              isArchived: false,
              createdAt: '2026-03-03T00:00:00.000Z',
              updatedAt: '2026-03-03T00:00:00.000Z',
            },
          ];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items, nextCursor: undefined }),
    });
  });

  await page.route('**/api/review/start', async (route) => {
    const body = route.request().postDataJSON() as { filter?: { filter?: string } };

    const today = body?.filter?.filter === 'today';
    const snapshot = {
      sessionId: 's1',
      status: 'in_progress',
      currentIndex: 0,
      totalCount: today ? 2 : 1,
      remainingCount: today ? 2 : 1,
      canGoPrev: false,
      canGoNext: false,
      filterSummary: {
        q: null,
        filter: today ? 'today' : null,
        sort: 'next_review_at',
        tagLabels: [],
        collectionLabels: [],
      },
      currentCard: {
        cardId: today ? 't1' : 'n1',
        title: today ? 'Today 1' : 'Normal 1',
        content: 'due today',
        answer: 'answer',
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
        totalCount: today ? 2 : 1,
      },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ snapshot }),
    });
  });

  await page.route('**/api/review/sessions/s1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: 's1',
        status: 'in_progress',
        currentIndex: 0,
        totalCount: 2,
        remainingCount: 2,
        canGoPrev: false,
        canGoNext: false,
        filterSummary: { q: null, filter: 'today', sort: 'next_review_at', tagLabels: [], collectionLabels: [] },
        currentCard: {
          cardId: 't1',
          title: 'Today 1',
          content: 'due today',
          answer: 'answer',
          tags: [],
          collectionLabel: null,
          nextReviewAt: '2026-03-07T00:00:00.000Z',
          reviewReason: { label: '今日の復習対象に含まれています', detail: '2026-03-07T00:00:00.000Z', source: 'next_review_at' },
          currentAssessment: null,
          locked: false,
        },
        summary: { forgotCount: 0, uncertainCount: 0, rememberedCount: 0, perfectCount: 0, assessedCount: 0, totalCount: 2 },
      }),
    });
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'ホーム' })).toBeVisible();
  await page.getByRole('link', { name: 'カード一覧' }).click();

  await expect(page.getByRole('heading', { name: 'カード一覧' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Normal 1' })).toBeVisible();

  await page.getByLabel('ステータス').selectOption('today');

  await expect(page.getByRole('heading', { name: 'Today 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Today 2' })).toBeVisible();

  await page.getByRole('button', { name: '復習開始', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Today 1' })).toBeVisible();
  await expect(page.getByTestId('review-session-identifier')).toHaveText('s1');
});
