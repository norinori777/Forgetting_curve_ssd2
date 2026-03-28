import type { CollectionManagementItem } from '../../domain/collectionSettings';
import { collectionSettingsMessages } from '../../domain/collectionSettings';

type Props = {
  items: CollectionManagementItem[];
  loading: boolean;
  loadError: string | null;
  onRetry: () => void;
  onEdit: (item: CollectionManagementItem) => void;
  onDelete: (item: CollectionManagementItem) => void;
};

function formatUpdatedAt(updatedAt: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(updatedAt));
}

export function CollectionManagementList({ items, loading, loadError, onRetry, onEdit, onDelete }: Props) {
  return (
    <section className="rounded-[28px] border border-border-subtle bg-surface-panel p-5" aria-labelledby="collection-management-list-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Collection List</p>
          <h2 id="collection-management-list-title" className="mt-2 text-2xl font-semibold text-text-primary">
            登録済みコレクション
          </h2>
        </div>
        <button type="button" onClick={onRetry} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
          一覧を再読み込み
        </button>
      </div>

      <p className="mt-3 text-sm leading-6 text-text-secondary">件数: {items.length}</p>

      {loadError ? (
        <div role="alert" className="mt-4 rounded-2xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
          {loadError}
        </div>
      ) : null}

      {loading && items.length === 0 ? <p className="mt-6 text-sm text-text-secondary">読み込み中...</p> : null}

      {!loading && items.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border-subtle bg-surface-base px-5 py-6 text-sm text-text-secondary">
          <p className="text-base font-semibold text-text-primary">まだコレクションがありません</p>
          <p className="mt-2 leading-6">{collectionSettingsMessages.helperEmptyState.text}</p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-3xl bg-surface-base px-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-text-primary">{item.name}</p>
                    <span className="rounded-full bg-surface-panel px-3 py-1 text-xs text-text-secondary">{item.cardCount}枚</span>
                  </div>
                  {item.description ? <p className="text-sm leading-6 text-text-secondary">{item.description}</p> : null}
                  <p className="text-xs text-text-muted">最終更新: {formatUpdatedAt(item.updatedAt)}</p>
                  {!item.canDelete ? (
                    <p className="text-xs text-status-danger">{item.deleteBlockedReason ?? collectionSettingsMessages.helperDeleteBlocked.text}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <button type="button" onClick={() => onEdit(item)} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className={[
                      'rounded-full px-4 py-2 text-sm',
                      item.canDelete ? 'bg-status-danger text-white' : 'border border-status-danger/30 bg-status-danger/10 text-status-danger',
                    ].join(' ')}
                  >
                    {item.canDelete ? '削除' : '削除不可'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}