import { useEffect, useRef } from 'react';

type Item = { id: string; title: string };

type Props = {
  open: boolean;
  items: Item[];
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function DeleteConfirmModal({ open, items, onConfirm, onCancel }: Props) {
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    confirmButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
      <div role="dialog" aria-modal="true" aria-label="delete-confirm" className="w-full max-w-lg rounded-3xl bg-surface-panel p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-text-primary">削除の確認</h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          削除は復元不可です。対象カード {items.length} 件を完全に削除します。
        </p>

        <ul className="mt-4 space-y-2 rounded-2xl bg-surface-base p-4 text-sm text-text-primary">
          {items.map((item) => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
            キャンセル
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={() => void onConfirm()}
            className="rounded-full bg-status-danger px-4 py-2 text-sm font-semibold text-white"
          >
            削除を確定
          </button>
        </div>
      </div>
    </div>
  );
}