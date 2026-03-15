import type { ApiCard } from '../../domain/cardList';

type Props = {
  card: ApiCard;
  selected?: boolean;
  onToggleSelected?: () => void;
};

export function CardItem({ card, selected = false, onToggleSelected }: Props) {
  const nextReviewAtLabel = new Date(card.nextReviewAt).toLocaleString();

  return (
    <article className="rounded-3xl border border-border-subtle bg-surface-panel p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-text-muted">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelected?.()}
              aria-label={`選択: ${card.title}`}
            />
            選択
          </label>

          <div>
            <h2 className="text-xl font-semibold text-text-primary">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{card.content}</p>
          </div>
        </div>
        <div className="grid min-w-[180px] gap-2 rounded-2xl bg-surface-base p-3 text-sm text-text-secondary">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-text-muted">次回復習日時</dt>
            <dd className="mt-1 text-text-primary">{nextReviewAtLabel}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-text-muted">習熟度</dt>
            <dd className="mt-1 text-text-primary">{card.proficiency}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-text-muted">直近正答率</dt>
            <dd className="mt-1 text-text-primary">{card.lastCorrectRate}</dd>
          </div>
        </div>
      </div>

      {card.tags.length > 0 ? (
        <ul aria-label="tags" className="mt-4 flex flex-wrap gap-2">
          {card.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-brand-secondary/20 px-3 py-1 text-xs font-medium text-brand-primary">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}