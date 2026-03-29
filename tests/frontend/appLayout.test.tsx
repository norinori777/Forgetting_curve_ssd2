import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AppLayout } from '../../frontend/src/components/uiParts/AppLayout';

function renderLayout(initialEntry = '/stats') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<section><h1>ホーム</h1></section>} />
          <Route path="/cards" element={<section><h1>カード一覧</h1></section>} />
          <Route path="/cards/create" element={<section><h1>学習カード登録</h1></section>} />
          <Route path="/review" element={<section><h1>復習</h1></section>} />
          <Route path="/stats" element={<section><h1>統計</h1></section>} />
          <Route path="/settings" element={<section><h1>設定</h1></section>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe('AppLayout', () => {
  it('does not render a breadcrumb region and omits home from the top-level menu', () => {
    renderLayout('/cards');

    expect(screen.queryByLabelText('パンくず')).not.toBeInTheDocument();

    const nav = screen.getByLabelText('トップレベルナビゲーション');
    expect(within(nav).queryByRole('link', { name: 'ホーム' })).not.toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'カード一覧' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: '学習カード登録' })).toBeInTheDocument();
  });

  it('navigates back to home from the brand region', async () => {
    const user = userEvent.setup();
    renderLayout('/stats');

    await user.click(screen.getByRole('link', { name: 'ホームへ移動' }));

    expect(await screen.findByRole('heading', { name: 'ホーム' })).toBeInTheDocument();
  });

  it('keeps compact spacing and wrap-capable navigation classes for smaller layouts', () => {
    renderLayout('/review');

    expect(screen.getByRole('main')).toHaveClass('pt-28', 'md:pt-32');
    expect(screen.getByLabelText('トップレベルナビゲーション')).toHaveClass('flex-wrap');
    expect(screen.getByRole('link', { name: 'ホームへ移動' })).toHaveClass('inline-flex');
  });
});