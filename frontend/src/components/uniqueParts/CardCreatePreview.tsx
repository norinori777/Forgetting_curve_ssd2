type Props = {
  title: string;
  content: string;
  tagNames: string[];
  collectionLabel: string | null;
};

export function CardCreatePreview({ title, content, tagNames, collectionLabel }: Props) {
  return (
    <section aria-label="入力プレビュー" className="rounded-[28px] border border-border-subtle bg-surface-panel p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">Preview</p>
      <h2 className="mt-2 text-xl font-semibold text-text-primary">入力プレビュー</h2>
      <dl className="mt-4 space-y-3 text-sm text-text-secondary">
        <div className="grid gap-1 md:grid-cols-[140px,1fr]">
          <dt className="font-medium text-text-primary">タイトル</dt>
          <dd>{title.trim().length > 0 ? title : '未入力'}</dd>
        </div>
        <div className="grid gap-1 md:grid-cols-[140px,1fr]">
          <dt className="font-medium text-text-primary">タグ</dt>
          <dd>{tagNames.length > 0 ? tagNames.join(', ') : '未設定'}</dd>
        </div>
        <div className="grid gap-1 md:grid-cols-[140px,1fr]">
          <dt className="font-medium text-text-primary">コレクション</dt>
          <dd>{collectionLabel ?? '未設定'}</dd>
        </div>
        <div className="grid gap-1 md:grid-cols-[140px,1fr]">
          <dt className="font-medium text-text-primary">学習内容</dt>
          <dd className="whitespace-pre-wrap break-words">{content.trim().length > 0 ? content : '未入力'}</dd>
        </div>
      </dl>
    </section>
  );
}