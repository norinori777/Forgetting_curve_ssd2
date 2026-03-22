import { expect, test } from '@playwright/test';

test('US2: 回答内の検索語でも一覧結果にヒットする', async ({ page }) => {
  await page.route('**/api/cards**', async (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('q') ?? '';

    const items =
      q === 'keyword'
        ? [
            {
              id: 'c1',
              title: 'Answer Match',
              content: 'question',
              answer: 'contains keyword',
              tags: [],
              collectionId: null,
              proficiency: 0,
              nextReviewAt: '2026-03-07T00:00:00.000Z',
              lastCorrectRate: 0,
              isArchived: false,
              createdAt: '2026-03-01T00:00:00.000Z',
              updatedAt: '2026-03-01T00:00:00.000Z',
            },
          ]
        : [
            {
              id: 'c2',
              title: 'Unanswered Card',
              content: 'question',
              answer: null,
              tags: [],
              collectionId: null,
              proficiency: 0,
              nextReviewAt: '2026-03-08T00:00:00.000Z',
              lastCorrectRate: 0,
              isArchived: false,
              createdAt: '2026-03-02T00:00:00.000Z',
              updatedAt: '2026-03-02T00:00:00.000Z',
            },
          ];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items, nextCursor: undefined }),
    });
  });

  await page.goto('/cards');

  await expect(page.getByText('未登録')).toBeVisible();

  await page.getByLabel('検索').fill('keyword');
  await page.waitForTimeout(350);

  await expect(page.getByRole('heading', { name: 'Answer Match' })).toBeVisible();
});