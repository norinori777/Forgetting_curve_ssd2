export type TopLevelPage = {
  path: '/' | '/cards' | '/cards/create' | '/review' | '/stats' | '/settings';
  label: 'ホーム' | 'カード一覧' | '学習カード登録' | '復習' | '統計' | '設定';
};

export const topLevelPages: TopLevelPage[] = [
  { path: '/', label: 'ホーム' },
  { path: '/cards/create', label: '学習カード登録' },
  { path: '/cards', label: 'カード一覧' },
  { path: '/review', label: '復習' },
  { path: '/stats', label: '統計' },
  { path: '/settings', label: '設定' },
];

export function resolveTopLevelPage(pathname: string): TopLevelPage {
  if (pathname === '/') {
    return topLevelPages[0];
  }

  return [...topLevelPages]
    .sort((left, right) => right.path.length - left.path.length)
    .find((page) => pathname === page.path || pathname.startsWith(`${page.path}/`)) ?? topLevelPages[0];
}