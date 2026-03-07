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
    const body = route.request().postDataJSON() as any;

    const today = body?.filter?.filter === 'today';
    const cardIds = today ? ['t1', 't2'] : ['n1'];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessionId: 's1', cardIds }),
    });
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'カード一覧' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Normal 1' })).toBeVisible();

  await page.getByLabel('今日の復習').check();

  await expect(page.getByRole('heading', { name: 'Today 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Today 2' })).toBeVisible();

  await page.getByRole('button', { name: '復習開始' }).click();

  await expect(page.getByTestId('session-id')).toHaveText('s1');
  await expect(page.getByTestId('session-count')).toHaveText('2');
});
