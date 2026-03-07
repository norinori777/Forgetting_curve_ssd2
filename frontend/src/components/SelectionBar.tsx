type Props = {
  selectedCount: number;
  onArchive: () => void | Promise<void>;
  onDelete: () => void;
};

export function SelectionBar({ selectedCount, onArchive, onDelete }: Props) {
  const disabled = selectedCount === 0;

  return (
    <section aria-label="selection-bar">
      <p>
        <span data-testid="selected-count">{selectedCount}</span>件選択中
      </p>
      <button type="button" disabled={disabled} onClick={() => void onArchive()}>
        アーカイブ
      </button>
      <button type="button" disabled={disabled} onClick={onDelete}>
        削除
      </button>
    </section>
  );
}
