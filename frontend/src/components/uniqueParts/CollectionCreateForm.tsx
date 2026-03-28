import type { CollectionDraft, CollectionMutationState } from '../../domain/collectionSettings';
import { collectionSettingsMessages } from '../../domain/collectionSettings';

type Props = {
  draft: CollectionDraft;
  submitState: CollectionMutationState;
  submitError: string | null;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function CollectionCreateForm({
  draft,
  submitState,
  submitError,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  onReset,
}: Props) {
  const submitLabel = submitState === 'submitting' ? '登録中...' : submitError ? '再試行する' : '登録する';

  return (
    <form
      className="space-y-5 rounded-[28px] border border-border-subtle bg-surface-panel p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Collection Create</p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">新しいコレクションを登録</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          学習カードを整理するためのコレクションを追加できます。名前は必須、説明は任意です。
        </p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
        コレクション名 *
        <input
          value={draft.name}
          onChange={(event) => onNameChange(event.currentTarget.value)}
          placeholder="例: 英検2級 / 朝学習 / 面接対策"
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
          placeholder="使い分けが分かる説明を入力"
          className="min-h-28 rounded-2xl border border-border-subtle bg-surface-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
        <span className="text-xs text-text-muted">{collectionSettingsMessages.helperDescription.text}</span>
      </label>

      {submitError ? (
        <div role="alert" className="rounded-2xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
          {submitError}
        </div>
      ) : null}

      <div className="rounded-2xl bg-surface-base px-4 py-3 text-sm text-text-secondary">
        <p>入力ガイド</p>
        <p className="mt-2">短く見分けやすい名前を推奨します。同じ名前は登録できません。</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={onReset} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
          入力をクリア
        </button>
        <button type="submit" disabled={submitState === 'submitting'} className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}