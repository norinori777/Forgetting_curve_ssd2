import type { CardCsvImportRow, CardCsvImportSummary } from '../../domain/cardCsvImport';

type Props = {
  summary: CardCsvImportSummary;
  rows: CardCsvImportRow[];
};

export function CardCsvImportPreviewTable({ summary, rows }: Props) {
  if (summary.totalRows === 0) {
    return null;
  }

  return (
    <section aria-label="CSV取り込みプレビュー" className="rounded-[28px] border border-border-subtle bg-surface-panel p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">Preview</p>
      <h3 className="mt-2 text-xl font-semibold text-text-primary">取り込みプレビュー</h3>
      <dl className="mt-4 grid gap-3 text-sm text-text-secondary sm:grid-cols-4">
        <div className="rounded-2xl bg-surface-base px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.2em] text-text-muted">受付行数</dt>
          <dd className="mt-1 text-xl font-semibold text-text-primary">{summary.totalRows}</dd>
        </div>
        <div className="rounded-2xl bg-surface-base px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.2em] text-text-muted">正常</dt>
          <dd className="mt-1 text-xl font-semibold text-text-primary">{summary.validRows}</dd>
        </div>
        <div className="rounded-2xl bg-surface-base px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.2em] text-text-muted">エラー</dt>
          <dd className="mt-1 text-xl font-semibold text-text-primary">{summary.invalidRows}</dd>
        </div>
        <div className="rounded-2xl bg-surface-base px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.2em] text-text-muted">ヘッダー</dt>
          <dd className="mt-1 text-xl font-semibold text-text-primary">{summary.headerSkipped ? 'あり' : 'なし'}</dd>
        </div>
      </dl>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm text-text-secondary">
          <thead>
            <tr className="text-xs uppercase tracking-[0.15em] text-text-muted">
              <th className="px-3 py-2">行</th>
              <th className="px-3 py-2">タイトル</th>
              <th className="px-3 py-2">回答</th>
              <th className="px-3 py-2">タグ</th>
              <th className="px-3 py-2">コレクション</th>
              <th className="px-3 py-2">状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowNumber} className="rounded-2xl bg-surface-base align-top">
                <td className="px-3 py-3 font-medium text-text-primary">{row.rowNumber}</td>
                <td className="px-3 py-3 text-text-primary">{row.title || '未入力'}</td>
                <td className="px-3 py-3">{row.answer ?? '未設定'}</td>
                <td className="px-3 py-3">{row.tagNames.length > 0 ? row.tagNames.join(', ') : '未設定'}</td>
                <td className="px-3 py-3">{row.collectionName ?? '未設定'}</td>
                <td className="px-3 py-3">
                  {row.status === 'valid' ? '取込可' : row.issues.map((issue) => issue.messageText).join(' / ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}