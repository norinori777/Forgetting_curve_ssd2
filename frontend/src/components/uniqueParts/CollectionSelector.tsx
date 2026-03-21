type Props = {
  label: string | null;
  onOpen: () => void;
};

export function CollectionSelector({ label, onOpen }: Props) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-text-secondary">コレクション</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpen}
          aria-label="コレクションを選択"
          className="rounded-full border border-border-subtle bg-surface-panel px-4 py-2 text-sm text-text-primary"
        >
          コレクションを選択
        </button>
        <span className="text-sm text-text-secondary">{label ?? '未選択'}</span>
      </div>
    </div>
  );
}