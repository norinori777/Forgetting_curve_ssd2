import { CollectionSelector } from './CollectionSelector';

type Props = {
  title: string;
  content: string;
  tagInput: string;
  collectionLabel: string | null;
  titleError?: string;
  contentError?: string;
  submitError?: string | null;
  tagHelperText: string;
  unsavedChangesMessage?: string | null;
  submitState: 'idle' | 'submitting' | 'failed';
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onTagInputChange: (value: string) => void;
  onOpenCollectionPicker: () => void;
  onSubmit: () => void;
  onReset: () => void;
  onBack: () => void;
};

export function CardCreateForm({
  title,
  content,
  tagInput,
  collectionLabel,
  titleError,
  contentError,
  submitError,
  tagHelperText,
  unsavedChangesMessage,
  submitState,
  onTitleChange,
  onContentChange,
  onTagInputChange,
  onOpenCollectionPicker,
  onSubmit,
  onReset,
  onBack,
}: Props) {
  return (
    <form
      className="space-y-5 rounded-[28px] border border-border-subtle bg-surface-panel p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Create</p>
          <h2 className="mt-2 text-2xl font-semibold text-text-primary">基本情報</h2>
        </div>
        <button type="button" onClick={onBack} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
          一覧へ戻る
        </button>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
        タイトル *
        <input
          className="rounded-2xl border border-border-subtle bg-surface-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          value={title}
          onChange={(event) => onTitleChange(event.currentTarget.value)}
          placeholder="例: 英単語セットA"
        />
        {titleError ? <span role="alert" className="text-sm text-status-danger">{titleError}</span> : null}
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
        学習内容 *
        <textarea
          className="min-h-40 rounded-2xl border border-border-subtle bg-surface-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          value={content}
          onChange={(event) => onContentChange(event.currentTarget.value)}
          placeholder={'例:\nphotosynthesis = 光合成\nsunlight, water, carbon dioxide を使って栄養をつくる'}
        />
        {contentError ? <span role="alert" className="text-sm text-status-danger">{contentError}</span> : null}
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
        タグ
        <input
          className="rounded-2xl border border-border-subtle bg-surface-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          value={tagInput}
          onChange={(event) => onTagInputChange(event.currentTarget.value)}
          placeholder="英語, 基礎, 試験対策"
        />
        <span className="text-xs text-text-muted">{tagHelperText}</span>
      </label>

      <CollectionSelector label={collectionLabel} onOpen={onOpenCollectionPicker} />

      {submitError ? <div role="alert" className="rounded-2xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{submitError}</div> : null}
      {unsavedChangesMessage ? <div className="rounded-2xl bg-surface-base px-4 py-3 text-sm text-text-secondary">{unsavedChangesMessage}</div> : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={onReset} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
          入力をリセット
        </button>
        <button type="submit" disabled={submitState === 'submitting'} className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {submitState === 'submitting' ? '登録中...' : '登録する'}
        </button>
      </div>
    </form>
  );
}