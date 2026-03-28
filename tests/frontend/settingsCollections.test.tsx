import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { App } from '../../frontend/src/App';

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

function installFetchMock(initialItems: ManagedCollection[]) {
  let items = [...initialItems];
  let failOnceConsumed = false;

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (!url.includes('/api/collections/manage')) {
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }

      const method = init?.method ?? 'GET';

      if (method === 'GET') {
        return new Response(JSON.stringify({ items }), { status: 200 });
      }

      if (method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}')) as { name?: string; description?: string | null };
        const normalizedName = String(body.name ?? '').trim().toLocaleLowerCase('ja-JP');

        if (normalizedName === 'fail-once' && !failOnceConsumed) {
          failOnceConsumed = true;
          return new Response(JSON.stringify({ error: 'database_error', message: 'collection_management_failed' }), { status: 500 });
        }

        if (items.some((item) => item.name.trim().toLocaleLowerCase('ja-JP') === normalizedName)) {
          return new Response(JSON.stringify({ error: 'duplicate_name', message: 'duplicate_name' }), { status: 400 });
        }

        const created = buildCollection({
          id: `collection-${items.length + 1}`,
          name: String(body.name ?? '').trim(),
          description: body.description ?? null,
        });
        items = [created, ...items];
        return new Response(JSON.stringify({ ok: true, collection: created }), { status: 200 });
      }

      if (method === 'PATCH') {
        const body = JSON.parse(String(init?.body ?? '{}')) as { name?: string; description?: string | null };
        const collectionId = url.split('/').pop() ?? '';
        const target = items.find((item) => item.id === collectionId);
        const normalizedName = String(body.name ?? '').trim().toLocaleLowerCase('ja-JP');

        if (!target) {
          return new Response(JSON.stringify({ error: 'not_found', message: 'collection_not_found' }), { status: 404 });
        }

        if (items.some((item) => item.id !== collectionId && item.name.trim().toLocaleLowerCase('ja-JP') === normalizedName)) {
          return new Response(JSON.stringify({ error: 'duplicate_name', message: 'duplicate_name' }), { status: 400 });
        }

        const updated = {
          ...target,
          name: String(body.name ?? '').trim(),
          description: body.description ?? null,
          updatedAt: '2026-03-28T11:00:00.000Z',
        };
        items = items.map((item) => (item.id === collectionId ? updated : item));
        return new Response(JSON.stringify({ ok: true, collection: updated }), { status: 200 });
      }

      if (method === 'DELETE') {
        const collectionId = url.split('/').pop() ?? '';
        const target = items.find((item) => item.id === collectionId);

        if (!target) {
          return new Response(JSON.stringify({ error: 'not_found', message: 'collection_not_found' }), { status: 404 });
        }

        if (!target.canDelete) {
          return new Response(JSON.stringify({ error: 'collection_in_use', message: 'collection_in_use' }), { status: 409 });
        }

        items = items.filter((item) => item.id !== collectionId);
        return new Response(JSON.stringify({ ok: true, deletedId: collectionId }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: 'database_error' }), { status: 500 });
    }),
  );
}

describe('Settings collection management page', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows empty state, validates required input, and creates a collection', async () => {
    const user = userEvent.setup();
    installFetchMock([]);

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '設定' });
    expect(await screen.findByText('まだコレクションがありません')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '登録する' }));
    expect(await screen.findByText('コレクション名は必須です')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/コレクション名/), '新規コレクション');
    await user.type(screen.getByLabelText(/補足メモ/), '作成フロー確認用');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(await screen.findByRole('status')).toHaveTextContent('コレクションを登録しました。');
    expect(await screen.findByText('新規コレクション')).toBeInTheDocument();
  });

  it('updates an item, shows blocked delete reason, and deletes an available collection', async () => {
    const user = userEvent.setup();
    installFetchMock([
      buildCollection({ id: 'editable', name: '編集対象', description: '更新前メモ' }),
      buildCollection({
        id: 'blocked',
        name: '利用中コレクション',
        description: '削除不可',
        cardCount: 3,
        canDelete: false,
        deleteBlockedReason: 'カードが残っているため削除できません。',
      }),
    ]);

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByText('編集対象');

    const editableRow = screen.getByText('編集対象').closest('li');
    expect(editableRow).not.toBeNull();
    await user.click(within(editableRow!).getByRole('button', { name: '編集' }));

    const dialog = await screen.findByRole('dialog', { name: 'collection-edit-modal' });
    const nameInput = within(dialog).getByLabelText(/コレクション名/);
    await user.clear(nameInput);
    await user.type(nameInput, '編集後');
    await user.click(within(dialog).getByRole('button', { name: '保存する' }));

    expect(await screen.findByRole('status')).toHaveTextContent('コレクションを更新しました。');
    expect(screen.queryByRole('dialog', { name: 'collection-edit-modal' })).not.toBeInTheDocument();

    const blockedRow = screen.getByText('利用中コレクション').closest('li');
    expect(blockedRow).not.toBeNull();
    await user.click(within(blockedRow!).getByRole('button', { name: '削除不可' }));

    const blockedDialog = await screen.findByRole('dialog', { name: 'collection-delete-blocked' });
    expect(within(blockedDialog).getByText(/カードが残っているため削除できません/)).toBeInTheDocument();
    await user.click(within(blockedDialog).getAllByRole('button', { name: '閉じる' })[0]);

    await user.click(screen.getByRole('button', { name: '削除' }));
    const deleteDialog = await screen.findByRole('dialog', { name: 'collection-delete-confirm' });
    await user.click(within(deleteDialog).getByRole('button', { name: '削除する' }));

    expect(await screen.findByRole('status')).toHaveTextContent('コレクションを削除しました。');
    expect(screen.queryByText('編集対象')).not.toBeInTheDocument();
  });

  it('preserves drafts after failure, shows duplicate errors, and discards cancelled modal edits', async () => {
    const user = userEvent.setup();
    installFetchMock([buildCollection({ id: 'existing', name: '既存コレクション', description: '元の説明' })]);

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByText('既存コレクション');

    await user.type(screen.getByLabelText(/コレクション名/), 'fail-once');
    await user.type(screen.getByLabelText(/補足メモ/), '一時失敗');
    await user.click(screen.getByRole('button', { name: '登録する' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('コレクションの保存に失敗しました。時間をおいて再試行してください。');
    expect(screen.getByLabelText(/コレクション名/)).toHaveValue('fail-once');
    expect(screen.getByLabelText(/補足メモ/)).toHaveValue('一時失敗');

    await user.click(screen.getByRole('button', { name: '再試行する' }));
    expect(await screen.findByRole('status')).toHaveTextContent('コレクションを登録しました。');

    await user.clear(screen.getByLabelText(/コレクション名/));
    await user.type(screen.getByLabelText(/コレクション名/), '既存コレクション');
    await user.click(screen.getByRole('button', { name: '登録する' }));
    expect(await screen.findByText('同じ名前のコレクションが既に存在します。別の名前を入力してください。')).toBeInTheDocument();

    const existingRow = screen.getByText('既存コレクション').closest('li');
    expect(existingRow).not.toBeNull();
    await user.click(within(existingRow!).getByRole('button', { name: '編集' }));

    const editDialog = await screen.findByRole('dialog', { name: 'collection-edit-modal' });
    const editNameInput = within(editDialog).getByLabelText(/コレクション名/);
    await user.clear(editNameInput);
    await user.type(editNameInput, 'キャンセル予定');
    await user.click(within(editDialog).getByRole('button', { name: 'キャンセル' }));

    await user.click(within(existingRow!).getByRole('button', { name: '編集' }));
    const reopenedDialog = await screen.findByRole('dialog', { name: 'collection-edit-modal' });
    expect(within(reopenedDialog).getByLabelText(/コレクション名/)).toHaveValue('既存コレクション');
  });
});