import { expect, test } from '@playwright/test';

async function mockCards(page: import('@playwright/test').Page) {
  await page.route('**/api/cards**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'c1',
            title: 'Mode Card',
            content: 'question',
            answer: 'line1\nline2\nline3\nline4',
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
    });
  });
}

test('US3: inline モードでは回答を初期表示する', async ({ page }) => {
  await mockCards(page);

  await page.addInitScript(() => {
    localStorage.setItem('fc.cardList.answerDisplayMode', 'inline');
  });
  await page.goto('/cards');
  await expect(page.getByText('line1')).toBeVisible();
});

test('US3: 不正な表示モード値では link にフォールバックする', async ({ page }) => {
  await mockCards(page);

  await page.addInitScript(() => {
    localStorage.setItem('fc.cardList.answerDisplayMode', 'invalid');
  });
  await page.goto('/cards');

  await expect(page.getByRole('button', { name: '回答を表示' })).toBeVisible();
});