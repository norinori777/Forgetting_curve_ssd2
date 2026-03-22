import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../../frontend/src/App';

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

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/collections')) {
        return new Response(JSON.stringify({ items: [{ id: 'col1', label: 'TOEIC 600' }] }), { status: 200 });
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
});