import type { CardCsvImportIssue } from '../../domain/cardCsvImport';

type Props = {
  issues: CardCsvImportIssue[];
};

export function CardCsvImportIssueList({ issues }: Props) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <section aria-label="CSVエラー一覧" className="rounded-[28px] border border-status-danger/30 bg-status-danger/10 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-status-danger">Issues</p>
      <h3 className="mt-2 text-lg font-semibold text-text-primary">エラー一覧</h3>
      <ul className="mt-4 space-y-2 text-sm text-status-danger">
        {issues.map((issue, index) => (
          <li key={`${issue.code}-${issue.rowNumber ?? 'file'}-${index}`} className="rounded-2xl bg-white/60 px-4 py-3">
            <span className="font-medium">{issue.rowNumber ? `${issue.rowNumber}行目:` : 'ファイル:'}</span>{' '}
            {issue.messageText}
            {issue.detail ? ` (${issue.detail})` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}