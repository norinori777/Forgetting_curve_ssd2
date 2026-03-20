export type TopLevelPage = {
  path: '/' | '/cards' | '/review' | '/stats' | '/settings';
  label: 'ホーム' | 'カード一覧' | '復習' | '統計' | '設定';
};

export const topLevelPages: TopLevelPage[] = [
  { path: '/', label: 'ホーム' },
  { path: '/cards', label: 'カード一覧' },
  { path: '/review', label: '復習' },
  { path: '/stats', label: '統計' },
  { path: '/settings', label: '設定' },
];

export function resolveTopLevelPage(pathname: string): TopLevelPage {
  if (pathname === '/') {
    return topLevelPages[0];
  }

  return topLevelPages.find((page) => pathname === page.path || pathname.startsWith(`${page.path}/`)) ?? topLevelPages[0];
}