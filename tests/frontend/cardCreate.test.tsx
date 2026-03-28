import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../../frontend/src/App';
import { createCsvFile } from '../helpers/csv';

function validateImportRows(rows: Array<Record<string, unknown>>) {
  const responseRows = rows.map((row) => {
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

  const issues = responseRows.flatMap((row) => row.issues);
  return {
    ok: true,
    summary: {
      totalRows: responseRows.length,
      headerSkipped: true,
      validRows: responseRows.length - issues.length,
      invalidRows: issues.length,
      canImport: issues.length === 0,
      importedRows: null,
    },
    rows: responseRows,
    issues,
  };
}

function installFetchMock() {
  let createdCards = [
    {
      id: 'existing-card',
      title: '既存カード',
      content: 'existing',
      answer: null,
      tags: [],
      collectionId: null,
      proficiency: 0,
      nextReviewAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
      lastCorrectRate: 0,
      isArchived: false,
      createdAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
    },
  ];
  let postCount = 0;
  let lastPostBody: Record<string, unknown> | null = null;
  let lastImportBody: Record<string, unknown> | null = null;

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/collections')) {
        return new Response(JSON.stringify({ items: [{ id: 'col1', label: 'TOEIC 600' }] }), { status: 200 });
      }

      if (url.includes('/api/cards/import/validate')) {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return new Response(JSON.stringify(validateImportRows(body.rows ?? [])), { status: 200 });
      }

      if (url.includes('/api/cards/import') && init?.method === 'POST') {
        const body = JSON.parse(String(init.body ?? '{}'));
        lastImportBody = body;

        const validation = validateImportRows(body.rows ?? []);
        if (!validation.summary.canImport) {
          return new Response(JSON.stringify({ error: 'validation_failed', details: validation }), { status: 409 });
        }

        const importedCards = (body.rows ?? []).map((row: any, index: number) => ({
          id: `imported-${index + 1}`,
          title: row.title,
          content: row.content,
          answer: row.answer ?? null,
          tags: row.tagNames ?? [],
          collectionId: row.collectionName ? 'col1' : null,
          proficiency: 0,
          nextReviewAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
          lastCorrectRate: 0,
          isArchived: false,
          createdAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
          updatedAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
        }));
        createdCards = [...importedCards, ...createdCards];

        return new Response(JSON.stringify({ ok: true, importedCount: importedCards.length, messageKey: 'cardCsvImport.success.imported' }), { status: 200 });
      }

      if (url.includes('/api/cards') && init?.method === 'POST') {
        postCount += 1;
        const body = JSON.parse(String(init.body ?? '{}'));
        lastPostBody = body;

        if (body.title === 'fail-once' && postCount === 1) {
          return new Response(JSON.stringify({ error: 'database_error', message: 'failed_to_persist_card' }), { status: 500 });
        }

        const createdCard = {
          id: `created-${postCount}`,
          title: body.title,
          content: body.content,
          answer: body.answer ?? null,
          tags: body.tagNames ?? [],
          collectionId: body.collectionId ?? null,
          proficiency: 0,
          nextReviewAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
          lastCorrectRate: 0,
          isArchived: false,
          createdAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
          updatedAt: new Date('2026-03-07T00:00:00.000Z').toISOString(),
        };

        createdCards = [createdCard, ...createdCards];

        return new Response(JSON.stringify({ ok: true, card: createdCard }), { status: 200 });
      }

      if (url.includes('/api/cards')) {
        return new Response(JSON.stringify({ items: createdCards, nextCursor: undefined }), { status: 200 });
      }

      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    }),
  );

  return {
    getLastPostBody: () => lastPostBody,
    getLastImportBody: () => lastImportBody,
  };
}

describe('CardCreate page', () => {
  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows preview updates, reset behavior, and no collection-create action', async () => {
    const user = userEvent.setup();
    installFetchMock();

    render(
      <MemoryRouter initialEntries={['/cards/create']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '学習カード登録' });

    await user.type(screen.getByLabelText(/タイトル/), '英単語セットA');
    await user.type(screen.getByLabelText(/学習内容/), 'photosynthesis = 光合成');
    await user.type(screen.getByLabelText(/^回答/), '植物が光エネルギーを使って糖を合成するはたらき');
    await user.type(screen.getByLabelText(/タグ/), '英語, 基礎');

    const preview = screen.getByRole('region', { name: '入力プレビュー' });
    expect(screen.getByText('英単語セットA')).toBeInTheDocument();
    expect(screen.getByText('英語, 基礎')).toBeInTheDocument();
    expect(within(preview).getByText('植物が光エネルギーを使って糖を合成するはたらき')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /コレクション.*作成/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '入力をリセット' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/タイトル/)).toHaveValue('');
      expect(screen.getByLabelText(/学習内容/)).toHaveValue('');
      expect(screen.getByLabelText(/^回答/)).toHaveValue('');
    });
  });

  it('validates required fields and redirects with success flash after submit', async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock();

    render(
      <MemoryRouter initialEntries={['/cards/create']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '学習カード登録' });

    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(await screen.findByText('タイトルは必須です')).toBeInTheDocument();
    expect(screen.getByText('学習内容は必須です')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/タイトル/), '英単語セットA');
    await user.type(screen.getByLabelText(/学習内容/), 'photosynthesis = 光合成');
    await user.type(screen.getByLabelText(/^回答/), '植物が光エネルギーを使って糖を合成するはたらき\n葉緑体で行われる');
    await user.type(screen.getByLabelText(/タグ/), '英語, 基礎');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(fetchMock.getLastPostBody()).toMatchObject({
      answer: '植物が光エネルギーを使って糖を合成するはたらき\n葉緑体で行われる',
    });
    expect(await screen.findByRole('heading', { name: 'カード一覧' })).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('カードを登録しました');
    expect(screen.getByRole('heading', { name: '英単語セットA' })).toBeInTheDocument();
  });

  it('submits whitespace-only answers as unregistered', async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock();

    render(
      <MemoryRouter initialEntries={['/cards/create']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '学習カード登録' });

    await user.type(screen.getByLabelText(/タイトル/), '空欄回答カード');
    await user.type(screen.getByLabelText(/学習内容/), 'content');
    await user.type(screen.getByLabelText(/^回答/), '   ');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(fetchMock.getLastPostBody()).toMatchObject({ answer: '   ' });
    expect(await screen.findByRole('heading', { name: 'カード一覧' })).toBeInTheDocument();
  });

  it('preserves inputs after network failure and succeeds on retry', async () => {
    const user = userEvent.setup();
    installFetchMock();

    render(
      <MemoryRouter initialEntries={['/cards/create']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '学習カード登録' });

    await user.type(screen.getByLabelText(/タイトル/), 'fail-once');
    await user.type(screen.getByLabelText(/学習内容/), 'retry body');
    await user.type(screen.getByLabelText(/^回答/), 'retry answer\nline 2');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('カードの登録に失敗しました。時間をおいて再試行してください。');
    expect(screen.getByLabelText(/タイトル/)).toHaveValue('fail-once');
    expect(screen.getByLabelText(/学習内容/)).toHaveValue('retry body');
    expect(screen.getByLabelText(/^回答/)).toHaveValue('retry answer\nline 2');

    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(await screen.findByRole('heading', { name: 'カード一覧' })).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('カードを登録しました');
  });

  it('uploads a CSV, validates rows, and imports all cards in one action', async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock();

    render(
      <MemoryRouter initialEntries={['/cards/create']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '学習カード登録' });
    await user.click(screen.getByRole('tab', { name: 'CSV一括登録' }));

    const csvFile = createCsvFile([
      'タイトル,学習内容,回答,タグ,コレクション',
      '英単語セットA,photosynthesis = 光合成,植物が光エネルギーを使って糖を合成するはたらき,英語;基礎,TOEIC 600',
      '英単語セットB,cell division = 細胞分裂,,英語;,',
    ].join('\n'));

    await user.upload(screen.getByLabelText('CSVファイル'), csvFile);

    expect(await screen.findByRole('heading', { name: '取り込みプレビュー' })).toBeInTheDocument();
    expect(screen.getByText('英単語セットA')).toBeInTheDocument();
    expect(screen.getByText('英単語セットB')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '一括登録する' }));

    expect(fetchMock.getLastImportBody()).toMatchObject({
      rows: [
        {
          title: '英単語セットA',
          content: 'photosynthesis = 光合成',
          answer: '植物が光エネルギーを使って糖を合成するはたらき',
          tagNames: ['英語', '基礎'],
          collectionName: 'TOEIC 600',
        },
        { title: '英単語セットB', content: 'cell division = 細胞分裂', answer: null, tagNames: ['英語'], collectionName: null },
      ],
    });
    expect(await screen.findByRole('heading', { name: 'カード一覧' })).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('2件のカードを登録しました');
  });

  it('blocks CSV import when validation finds an unknown collection', async () => {
    const user = userEvent.setup();
    installFetchMock();

    render(
      <MemoryRouter initialEntries={['/cards/create']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '学習カード登録' });
    await user.click(screen.getByRole('tab', { name: 'CSV一括登録' }));

    const csvFile = createCsvFile([
      'タイトル,学習内容,回答,タグ,コレクション',
      '英単語セットA,photosynthesis = 光合成,,英語,未知コレクション',
    ].join('\n'));

    await user.upload(screen.getByLabelText('CSVファイル'), csvFile);

    expect(await screen.findByText('指定されたコレクションが見つかりません。 (未知コレクション)')).toBeInTheDocument();
    expect(screen.getByLabelText('CSVエラー一覧')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '一括登録する' })).toBeDisabled();
  });

  it('exposes accessible CSV mode controls and preview landmarks', async () => {
    const user = userEvent.setup();
    installFetchMock();

    render(
      <MemoryRouter initialEntries={['/cards/create']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '学習カード登録' });

    const csvTab = screen.getByRole('tab', { name: 'CSV一括登録' });
    await user.click(csvTab);

    expect(screen.getByRole('tablist', { name: '登録モード' })).toBeInTheDocument();
    expect(csvTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('CSVファイル')).toBeInTheDocument();

    await user.upload(
      screen.getByLabelText('CSVファイル'),
      createCsvFile([
        'タイトル,学習内容,回答,タグ,コレクション',
        '英単語セットA,photosynthesis = 光合成,植物が光エネルギーを使って糖を合成するはたらき,英語;基礎,TOEIC 600',
      ].join('\n')),
    );

    expect(await screen.findByRole('heading', { name: '取り込みプレビュー' })).toBeInTheDocument();
    expect(screen.getByLabelText('CSV取り込みプレビュー')).toBeInTheDocument();
  });

  it('replaces preview results with a new file and clears CSV state on cancel', async () => {
    const user = userEvent.setup();
    installFetchMock();

    render(
      <MemoryRouter initialEntries={['/cards/create']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '学習カード登録' });
    await user.click(screen.getByRole('tab', { name: 'CSV一括登録' }));

    await user.upload(
      screen.getByLabelText('CSVファイル'),
      createCsvFile([
        'タイトル,学習内容,回答,タグ,コレクション',
        '英単語セットA,photosynthesis = 光合成,植物が光エネルギーを使って糖を合成するはたらき,英語;基礎,TOEIC 600',
      ].join('\n'), 'valid.csv'),
    );

    expect(await screen.findByText('valid.csv')).toBeInTheDocument();
    expect(await screen.findByText('英単語セットA')).toBeInTheDocument();

    await user.upload(
      screen.getByLabelText('CSVファイル'),
      createCsvFile([
        'タイトル,学習内容,回答,タグ,コレクション',
        '英単語セットB,cell division = 細胞分裂,,英語,未知コレクション',
      ].join('\n'), 'invalid.csv'),
    );

    expect(await screen.findByText('invalid.csv')).toBeInTheDocument();
    expect(screen.queryByText('valid.csv')).not.toBeInTheDocument();
    expect(screen.queryByText('英単語セットA')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(await screen.findByRole('tab', { name: '単票登録', selected: true })).toBeInTheDocument();
    expect(screen.getByLabelText(/タイトル/)).toBeInTheDocument();
    expect(screen.queryByText('invalid.csv')).not.toBeInTheDocument();
  });
});