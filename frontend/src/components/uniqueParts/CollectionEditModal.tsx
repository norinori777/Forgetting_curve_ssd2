import type { CollectionDraft, CollectionMutationState } from '../../domain/collectionSettings';
import { ModalShell } from '../uiParts/ModalShell';

type Props = {
  open: boolean;
  targetName: string;
  draft: CollectionDraft | null;
  submitState: CollectionMutationState;
  submitError: string | null;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function CollectionEditModal({
  open,
  targetName,
  draft,
  submitState,
  submitError,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  onClose,
}: Props) {
  if (!draft) {
    return null;
  }

  return (
    <ModalShell
      open={open}
      title="コレクションを編集"
      ariaLabel="collection-edit-modal"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
            キャンセル
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitState === 'submitting'}
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitState === 'submitting' ? '保存中...' : '保存する'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">対象: {targetName}</p>

        <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
          コレクション名 *
          <input
            value={draft.name}
            onChange={(event) => onNameChange(event.currentTarget.value)}
            className="rounded-2xl border border-border-subtle bg-surface-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
          {draft.fieldErrors.name ? (
            <span role="alert" className="text-sm text-status-danger">
              {draft.fieldErrors.name}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
          補足メモ（任意）
          <textarea
            value={draft.description}
            onChange={(event) => onDescriptionChange(event.currentTarget.value)}
            className="min-h-28 rounded-2xl border border-border-subtle bg-surface-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
        </label>

        {submitError ? (
          <div role="alert" className="rounded-2xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
            {submitError}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}