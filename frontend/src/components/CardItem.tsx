import type { ApiCard } from '../pages/CardList';

type Props = {
  card: ApiCard;
  selected?: boolean;
  onToggleSelected?: () => void;
};

export function CardItem({ card, selected = false, onToggleSelected }: Props) {
  const nextReviewAtLabel = new Date(card.nextReviewAt).toLocaleString();

  return (
    <article>
      <label>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelected?.()}
          aria-label={`選択: ${card.title}`}
        />
        選択
      </label>

      <h2>{card.title}</h2>
      <p>{card.content}</p>

      <dl>
        <div>
          <dt>次回復習日時</dt>
          <dd>{nextReviewAtLabel}</dd>
        </div>
        <div>
          <dt>習熟度</dt>
          <dd>{card.proficiency}</dd>
        </div>
        <div>
          <dt>直近正答率</dt>
          <dd>{card.lastCorrectRate}</dd>
        </div>
      </dl>

      {card.tags.length > 0 ? (
        <ul aria-label="tags">
          {card.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
