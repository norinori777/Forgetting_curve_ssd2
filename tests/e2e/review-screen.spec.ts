import { expect, test } from '@playwright/test';

function buildSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: 's-review',
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
      collectionLabels: [],
    },
    currentCard: {
      cardId: 'c1',
      title: 'Review Card 1',
      content: 'question one',
      answer: 'answer one',
      tags: ['tag1'],
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
      totalCount: 2,
    },
    ...overrides,
  };
}

test('review loop completes from card list', async ({ page }) => {
  const first = buildSnapshot();
  const afterAssessment = buildSnapshot({
    canGoNext: true,
    currentCard: { ...first.currentCard, currentAssessment: 'remembered' },
    remainingCount: 1,
    summary: { ...first.summary, rememberedCount: 1, assessedCount: 1 },
  });
  const second = buildSnapshot({
    currentIndex: 1,
    canGoPrev: true,
    currentCard: { ...first.currentCard, cardId: 'c2', title: 'Review Card 2', content: 'question two', answer: 'answer two', currentAssessment: null },
    remainingCount: 1,
    summary: { ...first.summary, rememberedCount: 1, assessedCount: 1 },
  });
  const secondAfterAssessment = buildSnapshot({
    currentIndex: 1,
    canGoPrev: true,
    canGoNext: true,
    currentCard: { ...second.currentCard, currentAssessment: 'perfect' },
    remainingCount: 0,
    summary: { forgotCount: 0, uncertainCount: 0, rememberedCount: 1, perfectCount: 1, assessedCount: 2, totalCount: 2 },
  });
  const completed = buildSnapshot({
    status: 'completed',
    currentIndex: 2,
    canGoPrev: false,
    canGoNext: false,
    currentCard: null,
    remainingCount: 0,
    summary: { forgotCount: 0, uncertainCount: 0, rememberedCount: 1, perfectCount: 1, assessedCount: 2, totalCount: 2 },
  });

  await page.route('**/api/cards**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'c1',
            title: 'Review Card 1',
            content: 'question one',
            answer: 'answer one',
            tags: ['tag1'],
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
    });
  });

  await page.route('**/api/review/start', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ snapshot: first }) });
  });

  await page.route('**/api/review/sessions/s-review', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(first) });
  });

  await page.route('**/api/review/sessions/s-review/assessment', async (route) => {
    const body = route.request().postDataJSON() as { assessment: string };
    const result = body.assessment === 'remembered' ? afterAssessment : secondAfterAssessment;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
  });

  let nextCount = 0;
  await page.route('**/api/review/sessions/s-review/navigation', async (route) => {
    nextCount += 1;
    const result = nextCount === 1 ? second : completed;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(result) });
  });

  await page.goto('/cards');
  await page.getByRole('button', { name: '復習開始', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review Card 1' })).toBeVisible();

  await page.getByRole('button', { name: '回答を表示' }).click();
  await expect(page.getByText('answer one')).toBeVisible();
  await page.keyboard.press('3');
  await expect(page.getByRole('button', { name: '次へ' })).toBeEnabled();
  await page.getByRole('button', { name: '次へ' }).click();

  await expect(page.getByRole('heading', { name: 'Review Card 2' })).toBeVisible();
  await page.getByRole('button', { name: '回答を表示' }).click();
  await page.keyboard.press('4');
  await page.getByRole('button', { name: '次へ' }).click();

  await expect(page.getByRole('heading', { name: '今回の復習が完了しました' })).toBeVisible();
});

test('shows cached fallback and recovers on retry', async ({ page }) => {
  const snapshot = buildSnapshot();

  await page.addInitScript((value) => {
    window.localStorage.setItem(`fc.review.cachedSnapshot:${value.sessionId}`, JSON.stringify({ sessionId: value.sessionId, snapshot: value, cachedAt: new Date().toISOString() }));
  }, snapshot);

  let firstGet = true;
  await page.route('**/api/review/sessions/s-review', async (route) => {
    if (firstGet) {
      firstGet = false;
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'review_temporary_failure' }) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snapshot) });
  });

  await page.goto('/review?sessionId=s-review');
  await expect(page.getByRole('alert')).toContainText('最後に取得した内容を表示しています');
  await page.getByRole('button', { name: '再試行' }).click();
  await expect(page.getByRole('heading', { name: 'Review Card 1' })).toBeVisible();
});

test('resumes the same in-progress session after leaving the review page', async ({ page }) => {
  const first = buildSnapshot();
  const afterAssessment = buildSnapshot({
    canGoNext: true,
    currentCard: { ...first.currentCard, currentAssessment: 'remembered' },
    remainingCount: 1,
    summary: { ...first.summary, rememberedCount: 1, assessedCount: 1 },
  });
  const second = buildSnapshot({
    currentIndex: 1,
    canGoPrev: true,
    currentCard: { ...first.currentCard, cardId: 'c2', title: 'Review Card 2', content: 'question two', answer: 'answer two', currentAssessment: null },
    remainingCount: 1,
    summary: { ...first.summary, rememberedCount: 1, assessedCount: 1 },
  });

  let currentSnapshot = first;

  await page.route('**/api/cards**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'c1',
            title: 'Review Card 1',
            content: 'question one',
            answer: 'answer one',
            tags: ['tag1'],
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
    });
  });

  await page.route('**/api/review/start', async (route) => {
    currentSnapshot = first;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ snapshot: first }) });
  });

  await page.route('**/api/review/sessions/s-review', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentSnapshot) });
  });

  await page.route('**/api/review/sessions/s-review/assessment', async (route) => {
    currentSnapshot = afterAssessment;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(afterAssessment) });
  });

  await page.route('**/api/review/sessions/s-review/navigation', async (route) => {
    currentSnapshot = second;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(second) });
  });

  await page.goto('/cards');
  await page.getByRole('button', { name: '復習開始', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Review Card 1' })).toBeVisible();

  await page.getByRole('button', { name: '回答を表示' }).click();
  await page.keyboard.press('3');
  await expect(page.getByRole('button', { name: '次へ' })).toBeEnabled();
  await page.getByRole('button', { name: '次へ' }).click();
  await expect(page.getByRole('heading', { name: 'Review Card 2' })).toBeVisible();

  await page.getByRole('button', { name: '一覧へ戻る' }).click();
  await expect(page).toHaveURL(/\/cards$/);

  await page.getByRole('link', { name: '復習' }).click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(page.getByRole('heading', { name: 'Review Card 2' })).toBeVisible();
  await expect(page.getByText('question two')).toBeVisible();
});

test('shows targetResolution notice when review start excludes cards over the cap', async ({ page }) => {
  const snapshot = buildSnapshot({
    totalCount: 200,
    remainingCount: 200,
    filterSummary: {
      q: null,
      filter: 'today',
      sort: 'next_review_at',
      tagLabels: ['tag1'],
      collectionLabels: [],
      targetResolution: {
        matchedCount: 205,
        includedCount: 200,
        excludedCount: 5,
        exclusionBreakdown: [{ reason: 'over_limit', count: 5 }],
      },
    },
    summary: {
      forgotCount: 0,
      uncertainCount: 0,
      rememberedCount: 0,
      perfectCount: 0,
      assessedCount: 0,
      totalCount: 200,
    },
  });

  await page.route('**/api/cards**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'c1',
            title: 'Review Card 1',
            content: 'question one',
            answer: 'answer one',
            tags: ['tag1'],
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
    });
  });

  await page.route('**/api/review/start', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ snapshot }) });
  });

  await page.route('**/api/review/sessions/s-review', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snapshot) });
  });

  await page.goto('/cards');
  await page.getByRole('button', { name: '復習開始', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Review Card 1' })).toBeVisible();
  await expect(page.getByText('除外 5 件（上限超過 5 件）')).toBeVisible();
});