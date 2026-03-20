import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { resolveTopLevelPage, topLevelPages } from '../../utils/routes/topLevelPages';

function navLinkClassName(isActive: boolean): string {
  return [
    'rounded-full px-4 py-2 text-sm font-medium transition',
    isActive ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-surface-base hover:text-text-primary',
  ].join(' ');
}

export function AppLayout() {
  const location = useLocation();
  const currentPage = resolveTopLevelPage(location.pathname);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border-subtle bg-surface-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Forgetting Curve</p>
              <p className="mt-1 text-2xl font-semibold text-text-primary">学習カードアプリ</p>
            </div>
            <nav aria-label="トップレベルナビゲーション" className="flex flex-wrap gap-2">
              {topLevelPages.map((page) => (
                <NavLink key={page.path} to={page.path} className={({ isActive }) => navLinkClassName(isActive)} end={page.path === '/'}>
                  {page.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div aria-label="パンくず" className="rounded-[20px] bg-surface-base px-4 py-3 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{currentPage.label}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-40 md:px-8 md:pt-44">
        <Outlet />
      </main>

      <footer className="border-t border-border-subtle bg-surface-panel">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-text-secondary md:px-8">共通フッター</div>
      </footer>
    </div>
  );
}