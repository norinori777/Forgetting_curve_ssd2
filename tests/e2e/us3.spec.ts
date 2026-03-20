import { expect, test } from '@playwright/test';

function seedCards() {
  return [
    {
      id: 'c1',
      title: 'Card 1',
      content: 'one',
      tags: [],
      collectionId: null,
      proficiency: 0,
      nextReviewAt: '2026-03-07T00:00:00.000Z',
      lastCorrectRate: 0.0,
      isArchived: false,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'c2',
      title: 'Card 2',
      content: 'two',
      tags: [],
      collectionId: null,
      proficiency: 10,
      nextReviewAt: '2026-03-08T00:00:00.000Z',
      lastCorrectRate: 0.2,
      isArchived: false,
      createdAt: '2026-03-02T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    },
  ];
}

test('US3: 複数選択 → 一括アーカイブ', async ({ page }) => {
  let cards = seedCards();

  await page.route('**/api/cards**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: cards, nextCursor: undefined }),
    });
  });

  await page.route('**/api/cards/bulk', async (route) => {
    const body = route.request().postDataJSON() as any;
    if (body?.action === 'archive') {
      cards = cards.filter((c) => !body.cardIds.includes(c.id));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archived: body.cardIds.length }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Card 1' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Card 2' })).toBeVisible();

  await page.getByLabel('選択: Card 1').check();
  await page.getByLabel('選択: Card 2').check();

  await expect(page.getByTestId('selected-count')).toHaveText('2');

  await page.getByRole('button', { name: 'アーカイブ' }).click();

  await expect(page.getByText('条件に一致するカードがありません。')).toBeVisible();
});

test('US3: 削除確認モーダル（Escでキャンセル／確定で削除）', async ({ page }) => {
  let cards = seedCards();

  await page.route('**/api/cards**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: cards, nextCursor: undefined }),
    });
  });

  await page.route('**/api/cards/bulk', async (route) => {
    const body = route.request().postDataJSON() as any;
    if (body?.action === 'delete') {
      cards = cards.filter((c) => !body.cardIds.includes(c.id));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, deleted: body.cardIds.length }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });

  await page.goto('/');

  await page.getByLabel('選択: Card 1').check();
  await page.getByRole('button', { name: '削除', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'delete-confirm' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Card 1');
  await expect(dialog).toContainText('復元不可');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Card 1' })).toBeVisible();

  await page.getByRole('button', { name: '削除', exact: true }).click();
  await page.getByRole('button', { name: '削除する（復元不可）' }).click();

  await expect(page.getByRole('heading', { name: 'Card 1' })).toBeHidden();
});
