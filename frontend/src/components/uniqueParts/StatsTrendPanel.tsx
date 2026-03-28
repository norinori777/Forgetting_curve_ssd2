import type { TrendSeries } from '../../domain/stats';

type Props = {
  title: string;
  description: string;
  series: TrendSeries | null;
  testId: string;
  emptyMessage?: string;
};

export function StatsTrendPanel({ title, description, series, testId, emptyMessage = '表示できるデータがまだありません。' }: Props) {
  const maxValue = Math.max(...(series?.points.map((point) => point.value) ?? [0]), 1);

  return (
    <article className="rounded-[28px] border border-border-subtle bg-surface-base p-5" aria-label={title} data-testid={testId}>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>

      {series && series.points.length > 0 ? (
        <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10" aria-label={`${title}-points`}>
          {series.points.map((point) => (
            <div key={point.key} className="flex min-w-0 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end rounded-2xl bg-surface-panel px-2 py-2">
                <div className="w-full rounded-full bg-brand-primary/80" style={{ height: `${Math.max((point.value / maxValue) * 100, point.value > 0 ? 10 : 4)}%` }} title={`${point.label}: ${point.value}`} />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-text-primary">{point.value}</p>
                <p className="text-[11px] text-text-muted">{point.label}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border-subtle px-4 py-6 text-sm text-text-secondary">{emptyMessage}</div>
      )}
    </article>
  );
}