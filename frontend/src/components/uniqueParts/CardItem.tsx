import type { ApiCard } from '../../domain/cardList';

type Props = {
  card: ApiCard;
  selected?: boolean;
  onToggleSelected?: () => void;
  onStartReview?: () => void;
  answerVisible?: boolean;
  onShowAnswer?: () => void;
};

function formatCorrectRate(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function CardItem({ card, selected = false, onToggleSelected, onStartReview, answerVisible = false, onShowAnswer }: Props) {
  const nextReviewAtLabel = new Date(card.nextReviewAt).toLocaleString();
  const proficiencyLabel = `${Math.max(card.proficiency, 0)}`;

  return (
    <article
      className={`rounded-[28px] border p-5 shadow-sm transition ${
        selected ? 'border-brand-primary bg-brand-secondary/20' : 'border-border-subtle bg-surface-panel'
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-text-muted">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelected?.()}
              aria-label={`選択: ${card.title}`}
            />
            選択
          </label>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-text-primary">{card.title}</h2>
              {card.collectionId ? (
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-secondary">
                  collection
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{card.content}</p>

            <div className="rounded-2xl bg-surface-base px-4 py-3">
              <dt className="text-xs uppercase tracking-[0.12em] text-text-muted">回答</dt>
              {card.answer ? (
                answerVisible ? (
                  <dd
                    className="mt-2 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-text-primary"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                    }}
                  >
                    {card.answer}
                  </dd>
                ) : (
                  <dd className="mt-2">
                    <button
                      type="button"
                      onClick={onShowAnswer}
                      className="text-sm font-medium text-brand-primary underline-offset-2 transition hover:underline"
                    >
                      回答を表示
                    </button>
                  </dd>
                )
              ) : (
                <dd className="mt-2 text-sm leading-6 text-text-muted">未登録</dd>
              )}
            </div>
          </div>

          {card.tags.length > 0 ? (
            <ul aria-label="tags" className="flex flex-wrap gap-2">
              {card.tags.map((tag) => (
                <li key={tag} className="rounded-full bg-brand-secondary px-3 py-1 text-xs font-medium text-text-primary">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="grid min-w-[220px] gap-3 rounded-3xl bg-surface-base p-4 text-sm text-text-secondary">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-text-muted">次回復習日時</dt>
            <dd className="mt-1 text-text-primary">{nextReviewAtLabel}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-text-muted">習熟度</dt>
            <dd className="mt-1 text-text-primary">{proficiencyLabel}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-text-muted">直近正答率</dt>
            <dd className="mt-1 text-text-primary">{formatCorrectRate(card.lastCorrectRate)}</dd>
          </div>
          <button
            type="button"
            onClick={onStartReview}
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
          >
            この条件で復習開始
          </button>
        </div>
      </div>
    </article>
  );
}