import { expect, test } from '@playwright/test';

type ManagedCollection = {
  id: string;
  name: string;
  description: string | null;
  cardCount: number;
  updatedAt: string;
  canDelete: boolean;
  deleteBlockedReason: string | null;
};

function buildCollection(overrides: Partial<ManagedCollection>): ManagedCollection {
  return {
    id: overrides.id ?? 'collection-1',
    name: overrides.name ?? '英検2級',
    description: overrides.description ?? null,
    cardCount: overrides.cardCount ?? 0,
    updatedAt: overrides.updatedAt ?? '2026-03-28T09:00:00.000Z',
    canDelete: overrides.canDelete ?? true,
    deleteBlockedReason: overrides.deleteBlockedReason ?? null,
  };
}

async function installCollectionRoutes(page: Parameters<typeof test>[0]['page'], initialItems: ManagedCollection[]) {
  let items = [...initialItems];
  let failOnceConsumed = false;

  await page.route('**/api/collections/manage**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const collectionId = url.pathname.split('/').pop() ?? '';

    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items }),
      });
      return;
    }

    if (method === 'POST') {
      const body = request.postDataJSON() as { name?: string; description?: string | null };
      const normalizedName = String(body.name ?? '').trim().toLocaleLowerCase('ja-JP');

      if (normalizedName === 'fail-once' && !failOnceConsumed) {
        failOnceConsumed = true;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'database_error', message: 'collection_management_failed' }),
        });
        return;
      }

      if (items.some((item) => item.name.trim().toLocaleLowerCase('ja-JP') === normalizedName)) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'duplicate_name', message: 'duplicate_name' }),
        });
        return;
      }

      const created = buildCollection({
        id: `collection-${items.length + 1}`,
        name: String(body.name ?? '').trim(),
        description: body.description ?? null,
      });
      items = [created, ...items];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, collection: created }),
      });
      return;
    }

    if (method === 'PATCH') {
      const body = request.postDataJSON() as { name?: string; description?: string | null };
      const target = items.find((item) => item.id === collectionId);
      const normalizedName = String(body.name ?? '').trim().toLocaleLowerCase('ja-JP');

      if (!target) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not_found' }) });
        return;
      }

      if (items.some((item) => item.id !== collectionId && item.name.trim().toLocaleLowerCase('ja-JP') === normalizedName)) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'duplicate_name', message: 'duplicate_name' }),
        });
        return;
      }

      const updated = {
        ...target,
        name: String(body.name ?? '').trim(),
        description: body.description ?? null,
        updatedAt: '2026-03-28T11:00:00.000Z',
      };
      items = items.map((item) => (item.id === collectionId ? updated : item));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, collection: updated }),
      });
      return;
    }

    if (method === 'DELETE') {
      const target = items.find((item) => item.id === collectionId);

      if (!target) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not_found' }) });
        return;
      }

      if (!target.canDelete) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'collection_in_use', message: 'collection_in_use' }),
        });
        return;
      }

      items = items.filter((item) => item.id !== collectionId);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, deletedId: collectionId }),
      });
    }
  });
}

test('US1: settings page creates the first collection and shows validation', async ({ page }) => {
  await installCollectionRoutes(page, []);

  await page.goto('/settings');

  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
  await expect(page.getByText('まだコレクションがありません', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '登録する' }).click();
  await expect(page.getByText('コレクション名は必須です')).toBeVisible();

  await page.getByLabel(/コレクション名/).fill('新規コレクション');
  await page.getByLabel(/補足メモ/).fill('E2E 作成確認');
  await page.getByRole('button', { name: '登録する' }).click();

  await expect(page.getByRole('status')).toContainText('コレクションを登録しました。');
  await expect(page.getByText('新規コレクション')).toBeVisible();
});

test('US2: settings page updates, blocks in-use delete, and deletes available collections', async ({ page }) => {
  await installCollectionRoutes(page, [
    buildCollection({ id: 'editable', name: '編集対象', description: '更新前' }),
    buildCollection({
      id: 'blocked',
      name: '利用中コレクション',
      description: '削除不可',
      cardCount: 4,
      canDelete: false,
      deleteBlockedReason: 'カードが残っているため削除できません。',
    }),
  ]);

  await page.goto('/settings');

  await expect(page.getByText('編集対象')).toBeVisible();
  await page.locator('li', { hasText: '編集対象' }).getByRole('button', { name: '編集' }).click();

  const editDialog = page.getByRole('dialog', { name: 'collection-edit-modal' });
  await editDialog.getByLabel(/コレクション名/).fill('編集後');
  await editDialog.getByRole('button', { name: '保存する' }).click();

  await expect(page.getByText('編集後', { exact: true })).toBeVisible();

  await page.locator('li', { hasText: '利用中コレクション' }).getByRole('button', { name: '削除不可' }).click();
  const blockedDialog = page.getByRole('dialog', { name: 'collection-delete-blocked' });
  await expect(blockedDialog.getByText(/カードが残っているため削除できません/)).toBeVisible();
  await blockedDialog.getByRole('button', { name: '閉じる' }).first().click();

  await page.locator('li', { hasText: '編集後' }).getByRole('button', { name: '削除' }).click();
  const deleteDialog = page.getByRole('dialog', { name: 'collection-delete-confirm' });
  await deleteDialog.getByRole('button', { name: '削除する' }).click();

  await expect(page.getByText('編集後', { exact: true })).toHaveCount(0);
});

test('US3: settings page preserves drafts on retry, shows duplicate errors, and cancels modal edits safely', async ({ page }) => {
  await installCollectionRoutes(page, [buildCollection({ id: 'existing', name: '既存コレクション', description: '元の説明' })]);

  await page.goto('/settings');

  await expect(page.getByText('既存コレクション')).toBeVisible();

  await page.getByLabel(/コレクション名/).fill('fail-once');
  await page.getByLabel(/補足メモ/).fill('一時失敗');
  await page.getByRole('button', { name: '登録する' }).click();

  await expect(page.getByRole('alert')).toContainText('コレクションの保存に失敗しました。時間をおいて再試行してください。');
  await expect(page.getByLabel(/コレクション名/)).toHaveValue('fail-once');

  await page.getByRole('button', { name: '再試行する' }).click();
  await expect(page.getByRole('status')).toContainText('コレクションを登録しました。');

  await page.getByLabel(/コレクション名/).fill('既存コレクション');
  await page.getByRole('button', { name: '登録する' }).click();
  await expect(page.getByText('同じ名前のコレクションが既に存在します。別の名前を入力してください。')).toBeVisible();

  await page.locator('li', { hasText: '既存コレクション' }).getByRole('button', { name: '編集' }).click();
  const editDialog = page.getByRole('dialog', { name: 'collection-edit-modal' });
  await editDialog.getByLabel(/コレクション名/).fill('キャンセル予定');
  await editDialog.getByRole('button', { name: 'キャンセル' }).click();

  await page.locator('li', { hasText: '既存コレクション' }).getByRole('button', { name: '編集' }).click();
  await expect(page.getByRole('dialog', { name: 'collection-edit-modal' }).getByLabel(/コレクション名/)).toHaveValue('既存コレクション');
});