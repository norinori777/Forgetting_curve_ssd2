type Props = {
  selectedCount: number;
  onArchive: () => void | Promise<void>;
  onDelete: () => void;
};

export function SelectionBar({ selectedCount, onArchive, onDelete }: Props) {
  const disabled = selectedCount === 0;

  return (
    <section
      aria-label="selection-bar"
      className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface-panel px-4 py-3 shadow-lg"
    >
      <p className="text-sm text-text-secondary">
        <span data-testid="selected-count" className="font-semibold text-text-primary">
          {selectedCount}
        </span>
        件選択中
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => void onArchive()}
          className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-text-primary disabled:cursor-not-allowed disabled:text-text-muted"
        >
          アーカイブ
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="rounded-full bg-status-danger px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-surface-muted"
        >
          削除
        </button>
      </div>
    </section>
  );
}