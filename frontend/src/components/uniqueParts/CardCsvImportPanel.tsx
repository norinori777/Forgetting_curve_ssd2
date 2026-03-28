import type { ChangeEvent } from 'react';

import type { CardCsvImportPhase, SupportedCsvEncoding } from '../../domain/cardCsvImport';

type Props = {
  selectedFileName: string | null;
  selectedFileSize: number | null;
  detectedEncoding: SupportedCsvEncoding | null;
  phase: CardCsvImportPhase;
  generalError: string | null;
  canImport: boolean;
  helperFormatText: string;
  helperEncodingText: string;
  helperBlockedText: string;
  onFileChange: (file: File | null) => void;
  onImport: () => void;
  onCancel: () => void;
};

function formatSize(size: number | null): string | null {
  if (size === null) return null;
  if (size < 1024) return `${size} B`;
  return `${(size / 1024).toFixed(1)} KB`;
}

export function CardCsvImportPanel({
  selectedFileName,
  selectedFileSize,
  detectedEncoding,
  phase,
  generalError,
  canImport,
  helperFormatText,
  helperEncodingText,
  helperBlockedText,
  onFileChange,
  onImport,
  onCancel,
}: Props) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.currentTarget.files?.[0] ?? null);
  }

  return (
    <section className="space-y-5 rounded-[28px] border border-border-subtle bg-surface-panel p-5" aria-labelledby="card-csv-import-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">CSV Import</p>
          <h2 id="card-csv-import-title" className="mt-2 text-2xl font-semibold text-text-primary">CSV一括登録</h2>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-base px-4 py-4 text-sm text-text-secondary">
        <p>{helperFormatText}</p>
        <p className="mt-2 text-text-muted">{helperEncodingText}</p>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
        CSVファイル
        <input type="file" accept=".csv,text/csv" onChange={handleChange} className="rounded-2xl border border-border-subtle bg-surface-base px-4 py-3 text-sm text-text-primary" />
      </label>

      {selectedFileName ? (
        <div className="rounded-2xl bg-surface-base px-4 py-3 text-sm text-text-secondary">
          <p className="font-medium text-text-primary">{selectedFileName}</p>
          <p className="mt-1 text-text-muted">
            {formatSize(selectedFileSize)}
            {detectedEncoding ? ` / ${detectedEncoding}` : ''}
          </p>
        </div>
      ) : null}

      {generalError ? <div role="alert" className="rounded-2xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger">{generalError}</div> : null}

      {!canImport && selectedFileName ? <div className="rounded-2xl bg-surface-base px-4 py-3 text-sm text-text-secondary">{helperBlockedText}</div> : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
          キャンセル
        </button>
        <button
          type="button"
          onClick={onImport}
          disabled={!canImport || phase === 'importing' || phase === 'parsing' || phase === 'validating'}
          className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {phase === 'importing' ? '登録中...' : '一括登録する'}
        </button>
      </div>
    </section>
  );
}