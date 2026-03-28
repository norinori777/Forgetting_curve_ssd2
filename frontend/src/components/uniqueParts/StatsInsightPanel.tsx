import type { InsightItem } from '../../domain/stats';

type Props = {
  items: InsightItem[];
  isStale?: boolean;
};

export function StatsInsightPanel({ items, isStale = false }: Props) {
  return (
    <article className="rounded-[28px] border border-border-subtle bg-surface-base p-5" aria-label="統計インサイト">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">インサイト</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">前期間比とタグ別内訳から、次に見るべきポイントを短く示します。</p>
        </div>
        {isStale ? <span className="rounded-full bg-status-danger/10 px-3 py-1 text-xs font-semibold text-status-danger">キャッシュ表示</span> : null}
      </div>

      {items.length > 0 ? (
        <ul className="mt-5 space-y-3" aria-label="stats-insight-list">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border-subtle px-4 py-3 text-sm leading-6 text-text-primary">
              {item.message}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border-subtle px-4 py-6 text-sm text-text-secondary">表示できるインサイトはまだありません。</div>
      )}
    </article>
  );
}