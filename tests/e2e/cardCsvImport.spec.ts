import path from 'node:path';

import { expect, test } from '@playwright/test';

function buildValidationResponse(rows: Array<Record<string, unknown>>) {
  const validatedRows = rows.map((row) => {
    const title = String(row.title ?? '').trim();
    const content = String(row.content ?? '').trim();
    const answer = typeof row.answer === 'string' && row.answer.trim().length > 0 ? row.answer.trim() : null;
    const collectionName = typeof row.collectionName === 'string' && row.collectionName.trim().length > 0 ? row.collectionName.trim() : null;
    const issues = [] as Array<Record<string, unknown>>;

    if (title.length === 0) {
      issues.push({
        scope: 'row',
        rowNumber: row.rowNumber,
        code: 'title_required',
        messageKey: 'cardCsvImport.validation.titleRequired',
        messageText: 'タイトルは必須です。',
        detail: null,
      });
    }

    if (content.length === 0) {
      issues.push({
        scope: 'row',
        rowNumber: row.rowNumber,
        code: 'content_required',
        messageKey: 'cardCsvImport.validation.contentRequired',
        messageText: '学習内容は必須です。',
        detail: null,
      });
    }

    if (collectionName && collectionName !== 'TOEIC 600') {
      issues.push({
        scope: 'row',
        rowNumber: row.rowNumber,
        code: 'collection_not_found',
        messageKey: 'cardCsvImport.validation.collectionNotFound',
        messageText: '指定されたコレクションが見つかりません。',
        detail: collectionName,
      });
    }

    return {
      rowNumber: row.rowNumber,
      title,
      content,
      answer,
      tagNames: Array.isArray(row.tagNames) ? row.tagNames : [],
      collectionName,
      resolvedCollectionId: collectionName === 'TOEIC 600' ? 'col1' : null,
      status: issues.length > 0 ? 'invalid' : 'valid',
      issues,
    };
  });

  const invalidRows = validatedRows.filter((row) => row.status === 'invalid').length;

  return {
    ok: true,
    summary: {
      totalRows: validatedRows.length,
      headerSkipped: true,
      validRows: validatedRows.length - invalidRows,
      invalidRows,
      canImport: invalidRows === 0,
      importedRows: null,
    },
    rows: validatedRows,
    issues: validatedRows.flatMap((row) => row.issues),
  };
}

test.describe('card CSV import flow', () => {
  test('imports cards from a valid CSV file', async ({ page }) => {
    let cards = [
      {
        id: 'existing-card',
        title: '既存カード',
        content: 'existing',
        answer: null,
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

    await page.route('**/api/cards/import/validate', async (route) => {
      const payload = route.request().postDataJSON() as { rows: Array<Record<string, unknown>> };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildValidationResponse(payload.rows ?? [])),
      });
    });

    await page.route('**/api/cards/import', async (route) => {
      const payload = route.request().postDataJSON() as { rows: Array<Record<string, unknown>> };
      const imported = (payload.rows ?? []).map((row, index) => ({
        id: `imported-${index + 1}`,
        title: row.title,
        content: row.content,
        answer: row.answer ?? null,
        tags: Array.isArray(row.tagNames) ? row.tagNames : [],
        collectionId: row.collectionName ? 'col1' : null,
        proficiency: 0,
        nextReviewAt: '2026-03-07T00:00:00.000Z',
        lastCorrectRate: 0,
        isArchived: false,
        createdAt: '2026-03-07T00:00:00.000Z',
        updatedAt: '2026-03-07T00:00:00.000Z',
      }));
      cards = [...imported, ...cards];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, importedCount: imported.length, messageKey: 'cardCsvImport.success.imported' }),
      });
    });

    await page.route('**/api/cards**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname !== '/api/cards') {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: cards, nextCursor: undefined }),
      });
    });

    await page.route('**/api/collections', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{ id: 'col1', label: 'TOEIC 600' }] }),
      });
    });

    await page.goto('/cards/create');
    await page.getByRole('tab', { name: 'CSV一括登録' }).click();
    await page.getByLabel('CSVファイル').setInputFiles(path.resolve(process.cwd(), 'tests/fixtures/csv/cards-import-valid.csv'));

    await expect(page.getByRole('heading', { name: '取り込みプレビュー' })).toBeVisible();
    await expect(page.getByRole('button', { name: '一括登録する' })).toBeEnabled();
    await page.getByRole('button', { name: '一括登録する' }).click();

    await expect(page.getByRole('heading', { name: 'カード一覧' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('2件のカードを登録しました');
    await expect(page.getByRole('heading', { name: '英単語セットA' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '英単語セットB' })).toBeVisible();
  });

  test('shows row issues and blocks import for an unknown collection', async ({ page }) => {
    let importRequested = false;

    await page.route('**/api/cards/import/validate', async (route) => {
      const payload = route.request().postDataJSON() as { rows: Array<Record<string, unknown>> };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildValidationResponse(payload.rows ?? [])),
      });
    });

    await page.route('**/api/cards/import', async (route) => {
      importRequested = true;
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'database_error' }) });
    });

    await page.route('**/api/cards**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname !== '/api/cards') {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], nextCursor: undefined }),
      });
    });

    await page.route('**/api/collections', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{ id: 'col1', label: 'TOEIC 600' }] }),
      });
    });

    await page.goto('/cards/create');
    await page.getByRole('tab', { name: 'CSV一括登録' }).click();
    await page.getByLabel('CSVファイル').setInputFiles(path.resolve(process.cwd(), 'tests/fixtures/csv/cards-import-invalid.csv'));

    await expect(page.getByText('指定されたコレクションが見つかりません。 (未知コレクション)')).toBeVisible();
    await expect(page.getByRole('button', { name: '一括登録する' })).toBeDisabled();
    expect(importRequested).toBe(false);
  });

  test('recovers from invalid CSV after replacing it with a valid file', async ({ page }) => {
    let importedCount = 0;

    await page.route('**/api/cards/import/validate', async (route) => {
      const payload = route.request().postDataJSON() as { rows: Array<Record<string, unknown>> };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildValidationResponse(payload.rows ?? [])),
      });
    });

    await page.route('**/api/cards/import', async (route) => {
      const payload = route.request().postDataJSON() as { rows: Array<Record<string, unknown>> };
      importedCount = Array.isArray(payload.rows) ? payload.rows.length : 0;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, importedCount, messageKey: 'cardCsvImport.success.imported' }),
      });
    });

    await page.route('**/api/cards**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname !== '/api/cards') {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], nextCursor: undefined }),
      });
    });

    await page.route('**/api/collections', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{ id: 'col1', label: 'TOEIC 600' }] }),
      });
    });

    await page.goto('/cards/create');
    await page.getByRole('tab', { name: 'CSV一括登録' }).click();

    await page.getByLabel('CSVファイル').setInputFiles(path.resolve(process.cwd(), 'tests/fixtures/csv/cards-import-invalid.csv'));
    await expect(page.getByText('指定されたコレクションが見つかりません。 (未知コレクション)')).toBeVisible();
    await expect(page.getByRole('button', { name: '一括登録する' })).toBeDisabled();

    await page.getByLabel('CSVファイル').setInputFiles(path.resolve(process.cwd(), 'tests/fixtures/csv/cards-import-valid.csv'));
    await expect(page.getByText('指定されたコレクションが見つかりません。 (未知コレクション)')).toHaveCount(0);
    await expect(page.getByText('cards-import-valid.csv')).toBeVisible();
    await expect(page.getByRole('button', { name: '一括登録する' })).toBeEnabled();

    await page.getByRole('button', { name: '一括登録する' }).click();

    await expect(page.getByRole('heading', { name: 'カード一覧' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('2件のカードを登録しました');
    expect(importedCount).toBe(2);
  });

  test('shows preview data and clears CSV state when cancelled', async ({ page }) => {
    await page.route('**/api/cards/import/validate', async (route) => {
      const payload = route.request().postDataJSON() as { rows: Array<Record<string, unknown>> };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildValidationResponse(payload.rows ?? [])),
      });
    });

    await page.route('**/api/cards**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname !== '/api/cards') {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], nextCursor: undefined }),
      });
    });

    await page.route('**/api/collections', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{ id: 'col1', label: 'TOEIC 600' }] }),
      });
    });

    await page.goto('/cards/create');
    await page.getByRole('tab', { name: 'CSV一括登録' }).click();
    await page.getByLabel('CSVファイル').setInputFiles(path.resolve(process.cwd(), 'tests/fixtures/csv/cards-import-valid.csv'));

    await expect(page.getByRole('heading', { name: '取り込みプレビュー' })).toBeVisible();
    await expect(page.getByText('cards-import-valid.csv')).toBeVisible();

    await page.getByRole('button', { name: 'キャンセル' }).click();

    await expect(page.getByRole('tab', { name: '単票登録', selected: true })).toBeVisible();
    await expect(page.getByLabel('タイトル')).toBeVisible();
    await expect(page.getByText('cards-import-valid.csv')).toHaveCount(0);
  });
});