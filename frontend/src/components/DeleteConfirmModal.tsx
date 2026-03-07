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
    <div role="dialog" aria-modal="true" aria-label="delete-confirm">
      <h2>削除の確認</h2>
      <p>
        削除は復元不可（物理削除）です。対象: {items.length}件
      </p>

      <ul>
        {items.map((i) => (
          <li key={i.id}>{i.title}</li>
        ))}
      </ul>

      <button ref={confirmButtonRef} type="button" onClick={() => void onConfirm()}>
        削除を確定
      </button>
      <button type="button" onClick={onCancel}>
        キャンセル
      </button>
    </div>
  );
}
