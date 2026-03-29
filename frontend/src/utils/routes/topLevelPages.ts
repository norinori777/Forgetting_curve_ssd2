export type TopLevelPage = {
  path: '/' | '/cards' | '/cards/create' | '/review' | '/stats' | '/settings';
  label: 'ホーム' | 'カード一覧' | '学習カード登録' | '復習' | '統計' | '設定';
};

export const homePage: TopLevelPage = { path: '/', label: 'ホーム' };

export const topLevelPages: TopLevelPage[] = [
  homePage,
  { path: '/cards/create', label: '学習カード登録' },
  { path: '/cards', label: 'カード一覧' },
  { path: '/review', label: '復習' },
  { path: '/stats', label: '統計' },
  { path: '/settings', label: '設定' },
];

export const topLevelNavPages: TopLevelPage[] = topLevelPages.filter((page) => page.path !== '/');

export function resolveTopLevelPage(pathname: string): TopLevelPage {
  if (pathname === '/') {
    return homePage;
  }

  return [...topLevelPages]
    .sort((left, right) => right.path.length - left.path.length)
    .find((page) => pathname === page.path || pathname.startsWith(`${page.path}/`)) ?? homePage;
}