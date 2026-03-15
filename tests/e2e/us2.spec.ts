import { expect, test } from '@playwright/test';

test('US2: 検索/タグ絞り込み/ソートで一覧が変わる', async ({ page }) => {
  await page.route('**/api/cards**', async (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('q') ?? '';
    const tagIds = url.searchParams.get('tagIds') ?? '';
    const sort = url.searchParams.get('sort') ?? 'next_review_at';

    let items: any[] = [
      {
        id: 'base1',
        title: 'Base',
        content: 'base',
        tags: ['t0'],
        collectionId: null,
        proficiency: 1,
        nextReviewAt: '2026-03-10T00:00:00.000Z',
        lastCorrectRate: 0.1,
        isArchived: false,
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ];

    if (q.toLowerCase().includes('apple')) {
      items = [
        {
          id: 'q1',
          title: 'Apple',
          content: 'matched',
          tags: [],
          collectionId: null,
          proficiency: 10,
          nextReviewAt: '2026-03-10T00:00:00.000Z',
          lastCorrectRate: 0.2,
          isArchived: false,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        },
      ];
    }

    if (tagIds.includes('tag1')) {
      items = [
        {
          id: 't1',
          title: 'Tagged',
          content: 'tag matched',
          tags: ['tag1'],
          collectionId: null,
          proficiency: 20,
          nextReviewAt: '2026-03-09T00:00:00.000Z',
          lastCorrectRate: 0.3,
          isArchived: false,
          createdAt: '2026-03-03T00:00:00.000Z',
          updatedAt: '2026-03-03T00:00:00.000Z',
        },
      ];
    }

    if (sort === 'created_at') {
      items = [
        {
          id: 's1',
          title: 'Sorted by created_at',
          content: 'sorted',
          tags: [],
          collectionId: null,
          proficiency: 30,
          nextReviewAt: '2026-03-11T00:00:00.000Z',
          lastCorrectRate: 0.4,
          isArchived: false,
          createdAt: '2026-03-04T00:00:00.000Z',
          updatedAt: '2026-03-04T00:00:00.000Z',
        },
      ];
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items, nextCursor: undefined }),
    });
  });

  await page.route('**/api/tags**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [{ id: 'tag1', label: 'tag1' }] }),
    });
  });

  await page.route('**/api/collections**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [{ id: 'col1', label: 'col1' }] }),
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Base' })).toBeVisible();

  await page.getByLabel('検索').fill('apple');
  await page.waitForTimeout(350);
  await expect(page.getByRole('heading', { name: 'Apple' })).toBeVisible();

  await page.getByRole('button', { name: 'タグを選択' }).click();
  await page.getByRole('dialog', { name: 'tag-filter-modal' }).getByText('tag1').click();
  await page.getByRole('button', { name: '適用' }).click();
  await expect(page.getByRole('heading', { name: 'Tagged' })).toBeVisible();
  await expect(page.getByLabel('filters').getByText('tag1')).toBeVisible();

  await page.getByLabel('ソート').selectOption('created_at');
  await expect(page.getByRole('heading', { name: 'Sorted by created_at' })).toBeVisible();
});
