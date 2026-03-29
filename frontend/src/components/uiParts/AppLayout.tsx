import { Link, NavLink, Outlet } from 'react-router-dom';

import { homePage, topLevelNavPages } from '../../utils/routes/topLevelPages';

function navLinkClassName(isActive: boolean): string {
  return [
    'rounded-full px-4 py-2 text-sm font-medium transition',
    isActive ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-surface-base hover:text-text-primary',
  ].join(' ');
}

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border-subtle bg-surface-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 md:px-8 md:py-4">
          <Link
            to={homePage.path}
            aria-label="ホームへ移動"
            className="inline-flex min-w-0 items-center gap-3 rounded-[24px] px-1 py-1 transition hover:bg-surface-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
          >
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-brand-primary/12 text-sm font-semibold uppercase tracking-[0.16em] text-brand-primary">
              FC
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Forgetting Curve</span>
              <span className="block truncate text-lg font-semibold text-text-primary md:text-xl">学習カードアプリ</span>
            </span>
          </Link>

          <nav aria-label="トップレベルナビゲーション" className="flex flex-wrap items-center gap-2 md:justify-end">
            {topLevelNavPages.map((page) => (
                <NavLink key={page.path} to={page.path} className={({ isActive }) => navLinkClassName(isActive)} end>
                  {page.label}
                </NavLink>
              ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-28 md:px-8 md:pt-32">
        <Outlet />
      </main>

      <footer className="border-t border-border-subtle bg-surface-panel">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-text-secondary md:px-8">共通フッター</div>
      </footer>
    </div>
  );
}