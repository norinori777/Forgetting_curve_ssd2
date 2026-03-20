import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CardList } from '../../frontend/src/pages/CardList';

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

describe('CardList states', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows empty state and reset action', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/cards')) {
          return new Response(JSON.stringify({ items: [], nextCursor: undefined }), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }),
    );

    render(<CardList />);

    expect(await screen.findByText('条件に一致するカードがありません。')).toBeInTheDocument();
    const [cardList] = screen.getAllByRole('region', { name: 'card-list' });
    expect(within(cardList).getByRole('button', { name: '条件をリセット' })).toBeInTheDocument();
  });

  it('shows retry banner on initial load error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('error', { status: 500 })),
    );

    render(<CardList />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Error: HTTP 500');
  });

  it('opens tag modal and applies selected labels', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/tags')) {
          return new Response(JSON.stringify({ items: [{ id: 'tag1', label: 'tag1' }] }), { status: 200 });
        }
        if (url.includes('/api/cards')) {
          return new Response(JSON.stringify({ items: [], nextCursor: undefined }), { status: 200 });
        }
        if (url.includes('/api/collections')) {
          return new Response(JSON.stringify({ items: [] }), { status: 200 });
        }
        return new Response(JSON.stringify({}), { status: 200 });
      }),
    );

    render(<CardList />);

    const [filterSection] = screen.getAllByRole('region', { name: 'filters' });
    const openTagButton = await within(filterSection).findByRole('button', { name: 'タグ/コレクションを選択' });
    await user.click(openTagButton);
    const optionList = await screen.findByLabelText('shared-tag-options');
    await user.click(within(optionList).getByText('tag1'));
    await user.click(screen.getByRole('button', { name: '適用' }));

    await waitFor(() => {
      expect(screen.getByText('タグ: tag1')).toBeInTheDocument();
    });
  });
});