import { expect, test } from '@playwright/test';

test('US1: 回答リンク押下でそのカードだけ回答表示へ切り替わる', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('fc.cardList.answerDisplayMode', 'link');
  });

  await page.route('**/api/cards**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'c1',
            title: 'Card 1',
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
          {
            id: 'c2',
            title: 'Card 2',
            content: 'question two',
            answer: 'answer two',
            tags: [],
            collectionId: null,
            proficiency: 1,
            nextReviewAt: '2026-03-08T00:00:00.000Z',
            lastCorrectRate: 0.2,
            isArchived: false,
            createdAt: '2026-03-02T00:00:00.000Z',
            updatedAt: '2026-03-02T00:00:00.000Z',
          },
        ],
        nextCursor: undefined,
      }),
    });
  });

  await page.goto('/cards');

  const firstCard = page.getByRole('heading', { name: 'Card 1' }).locator('..').locator('..').locator('..');
  const secondCard = page.getByRole('heading', { name: 'Card 2' }).locator('..').locator('..').locator('..');

  await expect(page.getByRole('button', { name: '回答を表示' }).first()).toBeVisible();
  await firstCard.getByRole('button', { name: '回答を表示' }).click();

  await expect(firstCard.getByText('answer one')).toBeVisible();
  await expect(secondCard.getByRole('button', { name: '回答を表示' })).toBeVisible();
});