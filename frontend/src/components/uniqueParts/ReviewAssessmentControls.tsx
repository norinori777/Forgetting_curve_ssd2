import type { ReviewAssessment } from '../../domain/review';

type Props = {
  answerVisible: boolean;
  locked: boolean;
  currentAssessment: ReviewAssessment | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  onRevealAnswer: () => void;
  onSelectAssessment: (assessment: ReviewAssessment) => void;
  onPrev: () => void;
  onNext: () => void;
  onBackToList: () => void;
};

const ASSESSMENTS: Array<{ value: ReviewAssessment; label: string; shortcut: string }> = [
  { value: 'forgot', label: 'わからない', shortcut: '1' },
  { value: 'uncertain', label: 'あいまい', shortcut: '2' },
  { value: 'remembered', label: '思い出せた', shortcut: '3' },
  { value: 'perfect', label: '完全に一致', shortcut: '4' },
];

export function ReviewAssessmentControls({
  answerVisible,
  locked,
  currentAssessment,
  canGoPrev,
  canGoNext,
  onRevealAnswer,
  onSelectAssessment,
  onPrev,
  onNext,
  onBackToList,
}: Props) {
  return (
    <section className="rounded-[28px] border border-border-subtle bg-surface-panel p-5" aria-label="review-actions">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRevealAnswer}
          disabled={answerVisible}
          aria-keyshortcuts="V"
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted"
        >
          回答を表示
        </button>
        <button type="button" onClick={onPrev} disabled={!canGoPrev} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary disabled:cursor-not-allowed disabled:text-text-muted">
          前へ
        </button>
        <button type="button" onClick={onNext} disabled={!canGoNext} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary disabled:cursor-not-allowed disabled:text-text-muted">
          次へ
        </button>
        <button type="button" onClick={onBackToList} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary">
          一覧へ戻る
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ASSESSMENTS.map((item) => {
          const active = currentAssessment === item.value;
          return (
            <button
              key={item.value}
              type="button"
              disabled={!answerVisible || locked}
              aria-keyshortcuts={item.shortcut}
              onClick={() => onSelectAssessment(item.value)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                active ? 'border-brand-primary bg-brand-secondary/20 text-text-primary' : 'border-border-subtle bg-surface-base text-text-secondary'
              } disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted`}
            >
              <div className="text-xs uppercase tracking-[0.12em] text-text-muted">{item.shortcut}</div>
              <div className="mt-1 text-sm font-medium">{item.label}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}