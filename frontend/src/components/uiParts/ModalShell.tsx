import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  title: string;
  ariaLabel: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function ModalShell({ open, title, ariaLabel, onClose, children, footer }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-3xl bg-surface-panel shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-border-subtle px-3 py-1 text-sm text-text-secondary"
          >
            閉じる
          </button>
        </div>
        <div className="max-h-[55vh] overflow-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-border-subtle px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}