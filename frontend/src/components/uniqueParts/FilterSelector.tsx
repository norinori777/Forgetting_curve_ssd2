type Props = {
  tagLabels: string[];
  collectionLabels: string[];
  onOpen: () => void;
};

function renderSummary(label: string, items: string[]): string {
  return items.length > 0 ? `${label}: ${items.join(', ')}` : `${label}: 未選択`;
}

export function FilterSelector({ tagLabels, collectionLabels, onOpen }: Props) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-text-secondary">タグ / コレクション</span>
      <div className="flex flex-col gap-2 rounded-3xl border border-border-subtle bg-surface-panel p-3 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={onOpen}
          aria-label="タグ/コレクションを選択"
          className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-text-primary"
        >
          タグ/コレクションを選択
        </button>
        <div className="space-y-1 text-sm text-text-secondary">
          <p>{renderSummary('タグ', tagLabels)}</p>
          <p>{renderSummary('コレクション', collectionLabels)}</p>
        </div>
      </div>
    </div>
  );
}