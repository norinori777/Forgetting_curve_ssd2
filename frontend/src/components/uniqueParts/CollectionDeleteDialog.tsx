import type { CollectionManagementItem, CollectionMutationState } from '../../domain/collectionSettings';
import { collectionSettingsMessages } from '../../domain/collectionSettings';
import { ModalShell } from '../uiParts/ModalShell';

type Props = {
  open: boolean;
  item: CollectionManagementItem | null;
  submitState: CollectionMutationState;
  deleteError: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function CollectionDeleteDialog({ open, item, submitState, deleteError, onConfirm, onClose }: Props) {
  if (!item) {
    return null;
  }

  if (!item.canDelete) {
    return (
      <ModalShell
        open={open}
        title="このコレクションは削除できません"
        ariaLabel="collection-delete-blocked"
        onClose={onClose}
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
              閉じる
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-text-secondary">
          <p>対象: {item.name}</p>
          <p>理由: {item.deleteBlockedReason ?? collectionSettingsMessages.helperDeleteBlocked.text}</p>
          <p>{item.cardCount}枚の学習カードがまだ紐づいています。</p>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      open={open}
      title="コレクションを削除しますか？"
      ariaLabel="collection-delete-confirm"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitState === 'submitting'}
            className="rounded-full bg-status-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitState === 'submitting' ? '削除中...' : '削除する'}
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-text-secondary">
        <p>対象: {item.name}</p>
        <p>この操作は取り消せません。コレクション自体を一覧から削除します。</p>
        {deleteError ? (
          <div role="alert" className="rounded-2xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
            {deleteError}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}