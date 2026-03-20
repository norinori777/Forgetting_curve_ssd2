type Props = {
  selectedCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onAddTags: () => void;
  onRemoveTags: () => void;
  onArchive: () => void | Promise<void>;
  onDelete: () => void;
  disabled?: boolean;
};

export function SelectionBar({
  selectedCount,
  allSelected,
  onToggleAll,
  onAddTags,
  onRemoveTags,
  onArchive,
  onDelete,
  disabled = false,
}: Props) {
  const actionsDisabled = disabled || selectedCount === 0;

  return (
    <section
      aria-label="selection-bar"
      className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-border-subtle bg-surface-panel px-4 py-3 shadow-lg"
    >
      <label className="inline-flex items-center gap-3 text-sm text-text-secondary">
        <input type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="全選択" />
        <span>全選択</span>
      </label>

      <p className="text-sm text-text-secondary">
        選択数:
        <span data-testid="selected-count" className="ml-2 font-semibold text-text-primary">
          {selectedCount}
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={onAddTags}
          className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-text-primary disabled:cursor-not-allowed disabled:text-text-muted"
        >
          タグ付与
        </button>
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={onRemoveTags}
          className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-text-primary disabled:cursor-not-allowed disabled:text-text-muted"
        >
          タグ削除
        </button>
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={() => void onArchive()}
          className="rounded-full border border-border-subtle px-4 py-2 text-sm font-medium text-text-primary disabled:cursor-not-allowed disabled:text-text-muted"
        >
          アーカイブ
        </button>
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={onDelete}
          className="rounded-full bg-status-danger px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-surface-muted"
        >
          削除
        </button>
      </div>
    </section>
  );
}