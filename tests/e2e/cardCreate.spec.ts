import { expect, test } from '@playwright/test';

test.describe('card create flow', () => {
  test('US1/US2: navigates from list CTA and creates a card', async ({ page }) => {
    let cards = [
      {
        id: 'existing-card',
        title: '既存カード',
        content: 'existing',
        tags: [],
        collectionId: null,
        proficiency: 0,
        nextReviewAt: '2026-03-07T00:00:00.000Z',
        lastCorrectRate: 0,
        isArchived: false,
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ];

    await page.route('**/api/cards**', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() as any;
        const created = {
          id: 'created-card',
          title: payload.title,
          content: payload.content,
          answer: payload.answer ?? null,
          tags: payload.tagNames ?? [],
          collectionId: payload.collectionId ?? null,
          proficiency: 0,
          nextReviewAt: '2026-03-07T00:00:00.000Z',
          lastCorrectRate: 0,
          isArchived: false,
          createdAt: '2026-03-07T00:00:00.000Z',
          updatedAt: '2026-03-07T00:00:00.000Z',
        };
        cards = [created, ...cards];
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, card: created }) });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: cards, nextCursor: undefined }) });
    });

    await page.route('**/api/collections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{ id: 'col1', label: 'TOEIC 600' }] }),
      });
    });

    await page.goto('/cards');
    await page.getByRole('link', { name: '新規カード' }).click();

    await expect(page.getByRole('heading', { name: '学習カード登録' })).toBeVisible();
    await page.getByLabel(/タイトル/).fill('英単語セットA');
    await page.getByLabel(/学習内容/).fill('photosynthesis = 光合成');
    await page.getByLabel(/^回答/).fill('植物が光エネルギーを使って糖を合成するはたらき\n葉緑体で行われる');
    await page.getByLabel(/タグ/).fill('英語, 基礎');
    await page.getByRole('button', { name: '登録する' }).click();

    await expect(page.getByRole('heading', { name: 'カード一覧' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('カードを登録しました');
    await expect(page.getByRole('heading', { name: '英単語セットA' })).toBeVisible();
  });

  test('US2/US3: navigates from header and supports preview plus reset', async ({ page }) => {
    await page.route('**/api/cards**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], nextCursor: undefined }) });
    });

    await page.route('**/api/collections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{ id: 'col1', label: 'TOEIC 600' }] }),
      });
    });

    await page.goto('/');
    await page.getByRole('link', { name: '学習カード登録' }).click();

    await expect(page.getByRole('heading', { name: '学習カード登録' })).toBeVisible();
    await page.getByLabel(/タイトル/).fill('英単語セットA');
    await page.getByLabel(/学習内容/).fill('photosynthesis = 光合成');
    await page.getByLabel(/^回答/).fill('植物が光エネルギーを使って糖を合成するはたらき');
    await page.getByLabel(/タグ/).fill('英語, 基礎');

    const preview = page.getByLabel('入力プレビュー');
    await expect(page.getByText('英単語セットA')).toBeVisible();
    await expect(page.getByText('英語, 基礎')).toBeVisible();
    await expect(preview.getByText('植物が光エネルギーを使って糖を合成するはたらき')).toBeVisible();
    await expect(page.getByText('未保存の入力内容があります。このまま移動すると内容は失われます。')).toBeVisible();

    await page.getByRole('button', { name: '入力をリセット' }).click();
    await expect(page.getByLabel(/タイトル/)).toHaveValue('');
    await expect(page.getByLabel(/学習内容/)).toHaveValue('');
    await expect(page.getByLabel(/^回答/)).toHaveValue('');
  });

  test('US3: keeps input on failure and retries successfully', async ({ page }) => {
    let postCount = 0;

    await page.route('**/api/cards**', async (route) => {
      if (route.request().method() === 'POST') {
        postCount += 1;
        if (postCount === 1) {
          await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'database_error', message: 'failed_to_persist_card' }) });
          return;
        }

        const payload = route.request().postDataJSON() as any;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            card: {
              id: 'created-after-retry',
              title: payload.title,
              content: payload.content,
              answer: payload.answer ?? null,
              tags: payload.tagNames ?? [],
              collectionId: payload.collectionId ?? null,
              proficiency: 0,
              nextReviewAt: '2026-03-07T00:00:00.000Z',
              lastCorrectRate: 0,
              isArchived: false,
              createdAt: '2026-03-07T00:00:00.000Z',
              updatedAt: '2026-03-07T00:00:00.000Z',
            },
          }),
        });
        return;
      }

      const cards = postCount > 1
        ? [{ id: 'created-after-retry', title: 'fail-once', content: 'retry body', answer: 'retry answer\nline 2', tags: [], collectionId: null, proficiency: 0, nextReviewAt: '2026-03-07T00:00:00.000Z', lastCorrectRate: 0, isArchived: false, createdAt: '2026-03-07T00:00:00.000Z', updatedAt: '2026-03-07T00:00:00.000Z' }]
        : [];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: cards, nextCursor: undefined }) });
    });

    await page.goto('/cards/create');
    await page.getByLabel(/タイトル/).fill('fail-once');
    await page.getByLabel(/学習内容/).fill('retry body');
    await page.getByLabel(/^回答/).fill('retry answer\nline 2');

    await page.getByRole('button', { name: '登録する' }).click();
    await expect(page.getByRole('alert')).toContainText('カードの登録に失敗しました。時間をおいて再試行してください。');
    await expect(page.getByLabel(/タイトル/)).toHaveValue('fail-once');
    await expect(page.getByLabel(/学習内容/)).toHaveValue('retry body');
    await expect(page.getByLabel(/^回答/)).toHaveValue('retry answer\nline 2');

    await page.getByRole('button', { name: '登録する' }).click();
    await expect(page.getByRole('heading', { name: 'カード一覧' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('カードを登録しました');
  });

  test('US2: treats whitespace-only answer as unregistered', async ({ page }) => {
    let lastPayload: any = null;

    await page.route('**/api/cards**', async (route) => {
      if (route.request().method() === 'POST') {
        lastPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            card: {
              id: 'created-empty-answer',
              title: lastPayload.title,
              content: lastPayload.content,
              answer: null,
              tags: lastPayload.tagNames ?? [],
              collectionId: lastPayload.collectionId ?? null,
              proficiency: 0,
              nextReviewAt: '2026-03-07T00:00:00.000Z',
              lastCorrectRate: 0,
              isArchived: false,
              createdAt: '2026-03-07T00:00:00.000Z',
              updatedAt: '2026-03-07T00:00:00.000Z',
            },
          }),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], nextCursor: undefined }) });
    });

    await page.goto('/cards/create');
    await page.getByLabel(/タイトル/).fill('空欄回答カード');
    await page.getByLabel(/学習内容/).fill('content');
    await page.getByLabel(/^回答/).fill('   ');
    await page.getByRole('button', { name: '登録する' }).click();

    expect(lastPayload.answer).toBe('   ');
    await expect(page.getByRole('heading', { name: 'カード一覧' })).toBeVisible();
  });
});