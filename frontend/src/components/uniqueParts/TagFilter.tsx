type Props = {
  labels: string[];
  onOpen: () => void;
};

export function TagFilter({ labels, onOpen }: Props) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-text-secondary">タグ</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpen}
          aria-label="タグを選択"
          className="rounded-full border border-border-subtle bg-surface-panel px-4 py-2 text-sm text-text-primary"
        >
          タグを選択
        </button>
        <span className="text-sm text-text-secondary">{labels.length > 0 ? labels.join(', ') : '未選択'}</span>
      </div>
    </div>
  );
}