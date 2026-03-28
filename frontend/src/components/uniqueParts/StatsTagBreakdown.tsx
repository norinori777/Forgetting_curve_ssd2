import type { TagBreakdownItem } from '../../domain/stats';

type Props = {
  items: TagBreakdownItem[];
};

export function StatsTagBreakdown({ items }: Props) {
  return (
    <article className="rounded-[28px] border border-border-subtle bg-surface-base p-5" aria-label="分類別の内訳">
      <h2 className="text-lg font-semibold text-text-primary">分類別の内訳</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">レビュー件数と平均正答率から、次に見直すタグを判断できます。</p>

      {items.length > 0 ? (
        <ul className="mt-5 space-y-3" aria-label="stats-tag-breakdown-list">
          {items.map((item) => (
            <li key={item.tagId} className="rounded-2xl border border-border-subtle px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-text-primary">{item.tagName}</p>
                  <p className="mt-1 text-sm text-text-secondary">{item.reviewCount}件</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">正答率 {item.averageAccuracy === null ? '--' : `${Math.round(item.averageAccuracy)}%`}</p>
                  {item.isWeakest ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-status-danger">要改善</p> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border-subtle px-4 py-6 text-sm text-text-secondary">タグ別の内訳はまだありません。</div>
      )}
    </article>
  );
}