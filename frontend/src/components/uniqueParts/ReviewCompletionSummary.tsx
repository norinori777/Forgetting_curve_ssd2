import type { ReviewSessionSummary } from '../../domain/review';

type Props = {
  summary: ReviewSessionSummary;
  onBackToList: () => void;
};

export function ReviewCompletionSummary({ summary, onBackToList }: Props) {
  const rows = [
    ['わからない', summary.forgotCount],
    ['あいまい', summary.uncertainCount],
    ['思い出せた', summary.rememberedCount],
    ['完全に一致', summary.perfectCount],
  ];

  return (
    <section className="rounded-[28px] border border-border-subtle bg-surface-panel p-6" aria-label="review-completed">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Completed</p>
      <h1 className="mt-2 text-3xl font-semibold text-text-primary">今回の復習が完了しました</h1>
      <p className="mt-2 text-sm text-text-secondary">{summary.assessedCount} / {summary.totalCount} 件の評価を記録しました。</p>

      <dl className="mt-5 grid gap-3 md:grid-cols-2">
        {rows.map(([label, count]) => (
          <div key={label} className="rounded-2xl bg-surface-base px-4 py-3">
            <dt className="text-xs uppercase tracking-[0.12em] text-text-muted">{label}</dt>
            <dd className="mt-1 text-xl font-semibold text-text-primary">{count}</dd>
          </div>
        ))}
      </dl>

      <button type="button" onClick={onBackToList} className="mt-6 rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white">
        一覧へ戻る
      </button>
    </section>
  );
}