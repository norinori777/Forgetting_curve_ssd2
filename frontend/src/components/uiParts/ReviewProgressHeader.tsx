import type { ReviewSessionSnapshot } from '../../domain/review';

type Props = {
  snapshot: ReviewSessionSnapshot;
};

function formatFilterSummary(snapshot: ReviewSessionSnapshot): string {
  const parts: string[] = [];
  if (snapshot.filterSummary.filter) parts.push(`状態: ${snapshot.filterSummary.filter}`);
  if (snapshot.filterSummary.q) parts.push(`検索: ${snapshot.filterSummary.q}`);
  if (snapshot.filterSummary.tagLabels.length > 0) parts.push(`タグ: ${snapshot.filterSummary.tagLabels.join(', ')}`);
  if (snapshot.filterSummary.collectionLabels.length > 0) parts.push(`コレクション: ${snapshot.filterSummary.collectionLabels.join(', ')}`);
  parts.push(`ソート: ${snapshot.filterSummary.sort}`);
  return parts.join(' / ');
}

export function ReviewProgressHeader({ snapshot }: Props) {
  const card = snapshot.currentCard;

  return (
    <section className="rounded-[28px] border border-border-subtle bg-surface-panel p-5" aria-label="review-progress">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Review Session</p>
          <h1 className="text-3xl font-semibold text-text-primary">復習</h1>
          <p className="text-sm text-text-secondary">
            {snapshot.status === 'completed' ? '完了しました' : `現在 ${snapshot.currentIndex + 1} / ${snapshot.totalCount} ・ 残り ${snapshot.remainingCount}`}
          </p>
        </div>

        <div className="rounded-2xl bg-surface-base px-4 py-3 text-right text-xs text-text-muted">
          <div>session</div>
          <div data-testid="review-session-identifier" className="mt-1 font-mono text-[11px] tracking-[0.08em] text-text-muted/90">
            {snapshot.sessionId}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-surface-base px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">開始条件</p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{formatFilterSummary(snapshot)}</p>
        </div>

        {card ? (
          <div className="rounded-2xl bg-surface-base px-4 py-3">
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">今回の復習理由</p>
            <p data-testid="review-reason-label" className="mt-2 text-sm font-medium text-text-primary">
              {card.reviewReason.label}
            </p>
            {card.reviewReason.detail ? <p className="mt-1 text-xs text-text-secondary">{card.reviewReason.detail}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}