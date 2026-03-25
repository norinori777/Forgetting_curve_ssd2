import { expect, test } from '@playwright/test';

function buildDashboard(overrides: Record<string, unknown> = {}) {
  return {
    generatedAt: '2026-03-26T10:00:00.000Z',
    summary: {
      todayDueCount: 3,
      overdueCount: 1,
      unlearnedCount: 2,
      streakDays: 4,
    },
    recentActivities: [
      { id: 'a1', type: 'review_started', occurredAt: '2026-03-26T09:30:00.000Z', label: '3件の復習を開始', count: 3 },
      { id: 'a2', type: 'review_completed', occurredAt: '2026-03-26T08:00:00.000Z', label: '2件の復習を完了', count: 2 },
      { id: 'a3', type: 'card_created', occurredAt: '2026-03-25T18:00:00.000Z', label: '学習カードを追加', count: 1 },
    ],
    state: { firstUse: false, noReviewToday: false },
    ...overrides,
  };
}

function buildReviewSnapshot() {
  return {
    sessionId: 's-home',
    status: 'in_progress',
    currentIndex: 0,
    totalCount: 3,
    remainingCount: 3,
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
      content: 'question one',
      answer: 'answer one',
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
      totalCount: 3,
    },
  };
}

test('shows the home dashboard and starts today review', async ({ page }) => {
  const reviewSnapshot = buildReviewSnapshot();

  await page.route('**/api/home', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildDashboard()) });
  });

  await page.route('**/api/review/start', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ snapshot: reviewSnapshot }) });
  });

  await page.route('**/api/review/sessions/s-home', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reviewSnapshot) });
  });

  await page.goto('/');
  await expect(page.getByTestId('home-summary-today')).toHaveText('3');
  await expect(page.getByText('3件の復習を開始')).toBeVisible();

  await page.getByRole('button', { name: '復習を始める' }).click();
  await expect(page.getByRole('heading', { name: 'Home Review' })).toBeVisible();
});

test('shows first-use guidance when there are no cards', async ({ page }) => {
  await page.route('**/api/home', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildDashboard({
          summary: { todayDueCount: 0, overdueCount: 0, unlearnedCount: 0, streakDays: 0 },
          state: { firstUse: true, noReviewToday: true },
          recentActivities: [],
        }),
      ),
    });
  });

  await page.goto('/');
  await expect(page.getByText('最初の学習カードを登録しましょう。')).toBeVisible();
  await expect(page.getByRole('button', { name: '復習を始める' })).toBeDisabled();
  await expect(page.getByRole('link', { name: '学習カード登録へ' })).toBeVisible();
});

test('shows fetch failure and recovers on retry', async ({ page }) => {
  let first = true;
  await page.route('**/api/home', async (route) => {
    if (first) {
      first = false;
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'home_temporary_failure' }) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildDashboard({ summary: { todayDueCount: 0, overdueCount: 0, unlearnedCount: 2, streakDays: 4 }, state: { firstUse: false, noReviewToday: true } })) });
  });

  await page.goto('/');
  await expect(page.getByText('ホーム情報の取得に失敗しました。')).toBeVisible();
  await page.getByRole('button', { name: '再試行' }).click();
  await expect(page.getByText('今日の復習対象はありません。')).toBeVisible();
});