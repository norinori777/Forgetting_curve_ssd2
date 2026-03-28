import React from 'react';
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../../frontend/src/App';

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SC-002: initial render performance (synthetic)', () => {
  it('renders initial interactive state within 2s (synthetic)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], nextCursor: undefined }),
    });

    // @ts-expect-error testing stub
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

    const start = performance.now();
    render(
      <MemoryRouter initialEntries={['/cards']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'カード一覧' });
    const end = performance.now();

    expect(end - start).toBeLessThan(2000);
  });

  it('renders create page initial interactive state within 2s (synthetic)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], nextCursor: undefined }),
    });

    // @ts-expect-error testing stub
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

    const start = performance.now();
    render(
      <MemoryRouter initialEntries={['/cards/create']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '学習カード登録' });
    const end = performance.now();

    expect(end - start).toBeLessThan(2000);
  });

  it('renders CSV mode interactive state within 2s after mode switch (synthetic)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], nextCursor: undefined }),
    });

    // @ts-expect-error testing stub
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/cards/create']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '学習カード登録' });

    const start = performance.now();
    await user.click(screen.getByRole('tab', { name: 'CSV一括登録' }));
    await screen.findByRole('heading', { name: 'CSV一括登録' });
    const end = performance.now();

    expect(end - start).toBeLessThan(2000);
  });
});
