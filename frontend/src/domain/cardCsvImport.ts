import Papa from 'papaparse';

import type { CardListSuccessFlash } from './cardList';

export const cardCsvImportMessages = {
  successImported: {
    key: 'cardCsvImport.success.imported',
    text: '{{count}}件のカードを登録しました',
  },
  errorValidateFailed: {
    key: 'cardCsvImport.error.validateFailed',
    text: 'CSVの検証に失敗しました。内容を確認して再アップロードしてください。',
  },
  errorImportFailed: {
    key: 'cardCsvImport.error.importFailed',
    text: 'CSVの一括登録に失敗しました。時間をおいて再試行してください。',
  },
  errorUnsupportedEncoding: {
    key: 'cardCsvImport.error.unsupportedEncoding',
    text: '対応していない文字コードです。UTF-8、UTF-8 BOM、Shift_JIS のいずれかで保存してください。',
  },
  validationFileRequired: {
    key: 'cardCsvImport.validation.fileRequired',
    text: 'CSVファイルを選択してください。',
  },
  validationEmptyRows: {
    key: 'cardCsvImport.validation.emptyRows',
    text: 'CSVに登録対象のデータ行がありません。',
  },
  validationRowLengthMismatch: {
    key: 'cardCsvImport.validation.rowLengthMismatch',
    text: '5列のCSV形式で入力してください。回答列、タグ列、コレクション列も省略できません。',
  },
  validationTitleRequired: {
    key: 'cardCsvImport.validation.titleRequired',
    text: 'タイトルは必須です。',
  },
  validationContentRequired: {
    key: 'cardCsvImport.validation.contentRequired',
    text: '学習内容は必須です。',
  },
  validationCollectionNotFound: {
    key: 'cardCsvImport.validation.collectionNotFound',
    text: '指定されたコレクションが見つかりません。',
  },
  helperFormat: {
    key: 'cardCsvImport.helper.format',
    text: '1列目: タイトル、2列目: 学習内容、3列目: 回答、4列目: タグ、5列目: コレクション。タグはセミコロン区切り、学習内容の改行は \\n で表現します。',
  },
  helperSupportedEncoding: {
    key: 'cardCsvImport.helper.supportedEncoding',
    text: '対応文字コード: UTF-8 / UTF-8 BOM / Shift_JIS',
  },
  helperImportBlocked: {
    key: 'cardCsvImport.helper.importBlocked',
    text: 'エラーが1件でもある場合は一括登録できません。',
  },
} as const;

export type CardCsvImportMode = 'single' | 'csv';
export type SupportedCsvEncoding = 'utf-8' | 'utf-8-bom' | 'shift_jis';
export type CardCsvImportPhase = 'idle' | 'parsing' | 'parsed' | 'validating' | 'ready' | 'importing' | 'failed' | 'succeeded';
export type CardCsvImportIssueCode =
  | 'unsupported_encoding'
  | 'row_length_mismatch'
  | 'missing_optional_columns'
  | 'title_required'
  | 'content_required'
  | 'collection_not_found'
  | 'invalid_header'
  | 'validation_failed';

export type CardCsvImportIssue = {
  scope: 'file' | 'row';
  rowNumber: number | null;
  code: CardCsvImportIssueCode;
  messageKey: string;
  messageText: string;
  detail: string | null;
};

export type CardCsvImportRow = {
  rowNumber: number;
  title: string;
  content: string;
  answer: string | null;
  tagCell: string | null;
  tagNames: string[];
  collectionName: string | null;
  resolvedCollectionId: string | null;
  status: 'valid' | 'invalid';
  issues: CardCsvImportIssue[];
};

export type CardCsvImportSummary = {
  totalRows: number;
  headerSkipped: boolean;
  validRows: number;
  invalidRows: number;
  canImport: boolean;
  importedRows: number | null;
};

export type CardCsvImportDraft = {
  selectedFileName: string | null;
  selectedFileSize: number | null;
  detectedEncoding: SupportedCsvEncoding | null;
  phase: CardCsvImportPhase;
  rows: CardCsvImportRow[];
  issues: CardCsvImportIssue[];
  summary: CardCsvImportSummary;
  generalError: string | null;
};

export type CardImportRowInput = {
  rowNumber: number;
  title: string;
  content: string;
  answer: string | null;
  tagNames: string[];
  collectionName: string | null;
};

export type ValidateCardImportRequest = {
  headerSkipped?: boolean;
  rows: CardImportRowInput[];
};

export type ValidateCardImportResponse = {
  ok: true;
  summary: CardCsvImportSummary;
  rows: Array<Omit<CardCsvImportRow, 'tagCell'>>;
  issues: CardCsvImportIssue[];
};

export type ImportCardsRequest = {
  headerSkipped?: boolean;
  rows: CardImportRowInput[];
};

export type ImportCardsResponse = {
  ok: true;
  importedCount: number;
  messageKey: string;
};

export type CardCsvImportErrorResponse = {
  error: 'invalid_body' | 'validation_failed' | 'database_error';
  message?: string;
  details?: {
    summary?: CardCsvImportSummary;
    rows?: Array<Omit<CardCsvImportRow, 'tagCell'>>;
    issues?: CardCsvImportIssue[];
  };
};

const expectedHeader = ['タイトル', '学習内容', '回答', 'タグ', 'コレクション'] as const;

function createEmptySummary(): CardCsvImportSummary {
  return {
    totalRows: 0,
    headerSkipped: false,
    validRows: 0,
    invalidRows: 0,
    canImport: false,
    importedRows: null,
  };
}

export function createInitialCardCsvImportDraft(): CardCsvImportDraft {
  return {
    selectedFileName: null,
    selectedFileSize: null,
    detectedEncoding: null,
    phase: 'idle',
    rows: [],
    issues: [],
    summary: createEmptySummary(),
    generalError: null,
  };
}

export function buildCardCsvImportSuccessFlash(importedCount: number): CardListSuccessFlash {
  return {
    messageKey: cardCsvImportMessages.successImported.key,
    importedCount,
  };
}

export function formatCardCsvImportSuccess(importedCount: number): string {
  return cardCsvImportMessages.successImported.text.replace('{{count}}', String(importedCount));
}

export function normalizeCsvTagNames(value: string | null | undefined): string[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function normalizeCsvContent(value: string): string {
  return value.replace(/\\n/g, '\n').trim();
}

function normalizeCsvAnswer(value: string): string | null {
  const normalized = value.replace(/\\n/g, '\n').trim();
  return normalized.length > 0 ? normalized : null;
}

function isHeaderRow(row: string[]): boolean {
  return row.length === 5 && row.every((cell, index) => cell.trim() === expectedHeader[index]);
}

function createIssue(
  scope: 'file' | 'row',
  code: CardCsvImportIssueCode,
  rowNumber: number | null,
  detail: string | null = null,
): CardCsvImportIssue {
  const message =
    code === 'unsupported_encoding'
      ? cardCsvImportMessages.errorUnsupportedEncoding
      : code === 'row_length_mismatch' || code === 'missing_optional_columns'
        ? cardCsvImportMessages.validationRowLengthMismatch
        : code === 'title_required'
          ? cardCsvImportMessages.validationTitleRequired
          : code === 'content_required'
            ? cardCsvImportMessages.validationContentRequired
            : code === 'collection_not_found'
              ? cardCsvImportMessages.validationCollectionNotFound
              : cardCsvImportMessages.errorValidateFailed;

  return {
    scope,
    rowNumber,
    code,
    messageKey: message.key,
    messageText: message.text,
    detail,
  };
}

function buildSummary(rows: CardCsvImportRow[], headerSkipped: boolean, importedRows: number | null = null): CardCsvImportSummary {
  const invalidRows = rows.filter((row) => row.status === 'invalid').length;
  const validRows = rows.length - invalidRows;

  return {
    totalRows: rows.length,
    headerSkipped,
    validRows,
    invalidRows,
    canImport: rows.length > 0 && invalidRows === 0,
    importedRows,
  };
}

type DecodedCsv = {
  text: string;
  encoding: SupportedCsvEncoding;
};

async function readCsvFileBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === 'function') {
    return new Uint8Array(await file.arrayBuffer());
  }

  if (typeof file.text === 'function') {
    return new TextEncoder().encode(await file.text());
  }

  return await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error('failed_to_read_file'));
    reader.onload = () => {
      const result = reader.result;
      if (result instanceof ArrayBuffer) {
        resolve(new Uint8Array(result));
        return;
      }

      reject(new Error('failed_to_read_file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function decodeSupportedCsvBuffer(bytes: Uint8Array): DecodedCsv {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(3)),
      encoding: 'utf-8-bom',
    };
  }

  try {
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      encoding: 'utf-8',
    };
  } catch {
    try {
      return {
        text: new TextDecoder('shift_jis', { fatal: true }).decode(bytes),
        encoding: 'shift_jis',
      };
    } catch {
      throw createIssue('file', 'unsupported_encoding', null);
    }
  }
}

export async function parseCardCsvFile(file: File): Promise<{
  rows: CardCsvImportRow[];
  issues: CardCsvImportIssue[];
  summary: CardCsvImportSummary;
  detectedEncoding: SupportedCsvEncoding;
}> {
  const bytes = await readCsvFileBytes(file);
  const decoded = decodeSupportedCsvBuffer(bytes);
  const parsed = Papa.parse<string[]>(decoded.text, {
    skipEmptyLines: 'greedy',
  });

  const issues: CardCsvImportIssue[] = [];
  if (parsed.errors.length > 0) {
    parsed.errors.forEach((error) => {
      issues.push(createIssue('file', 'validation_failed', null, error.message));
    });
  }

  const parsedRows = parsed.data ?? [];
  const headerSkipped = parsedRows.length > 0 && isHeaderRow(parsedRows[0]);
  const dataRows = headerSkipped ? parsedRows.slice(1) : parsedRows;

  if (dataRows.length === 0) {
    issues.push({
      scope: 'file',
      rowNumber: null,
      code: 'validation_failed',
      messageKey: cardCsvImportMessages.validationEmptyRows.key,
      messageText: cardCsvImportMessages.validationEmptyRows.text,
      detail: null,
    });
  }

  const rows = dataRows.map<CardCsvImportRow>((rawRow, index) => {
    const rowNumber = headerSkipped ? index + 2 : index + 1;
    const rowIssues: CardCsvImportIssue[] = [];

    if (rawRow.length !== 5) {
      rowIssues.push(createIssue('row', 'row_length_mismatch', rowNumber, `検出列数: ${rawRow.length}`));
    }

    const title = (rawRow[0] ?? '').trim();
    const content = normalizeCsvContent(rawRow[1] ?? '');
    const answer = normalizeCsvAnswer(rawRow[2] ?? '');
    const tagCell = rawRow[3] ?? '';
    const collectionCell = (rawRow[4] ?? '').trim();

    if (title.length === 0) {
      rowIssues.push(createIssue('row', 'title_required', rowNumber));
    }

    if (content.length === 0) {
      rowIssues.push(createIssue('row', 'content_required', rowNumber));
    }

    return {
      rowNumber,
      title,
      content,
      answer,
      tagCell: tagCell.length > 0 ? tagCell : null,
      tagNames: normalizeCsvTagNames(tagCell),
      collectionName: collectionCell.length > 0 ? collectionCell : null,
      resolvedCollectionId: null,
      status: rowIssues.length > 0 ? 'invalid' : 'valid',
      issues: rowIssues,
    };
  });

  issues.push(...rows.flatMap((row) => row.issues));

  return {
    rows,
    issues,
    summary: buildSummary(rows, headerSkipped),
    detectedEncoding: decoded.encoding,
  };
}

export function toCardImportRowInputs(rows: CardCsvImportRow[]): CardImportRowInput[] {
  return rows.map((row) => ({
    rowNumber: row.rowNumber,
    title: row.title,
    content: row.content,
    answer: row.answer,
    tagNames: row.tagNames,
    collectionName: row.collectionName,
  }));
}

export function mergeValidatedRows(
  localRows: CardCsvImportRow[],
  serverRows: Array<Omit<CardCsvImportRow, 'tagCell'>>,
): CardCsvImportRow[] {
  const localByRowNumber = new Map(localRows.map((row) => [row.rowNumber, row]));

  return serverRows.map((row) => ({
    ...row,
    tagCell: localByRowNumber.get(row.rowNumber)?.tagCell ?? (row.tagNames.length > 0 ? row.tagNames.join('; ') : null),
  }));
}

export function isCardCsvImportDirty(draft: CardCsvImportDraft): boolean {
  return draft.selectedFileName !== null || draft.rows.length > 0 || draft.issues.length > 0 || draft.phase !== 'idle';
}

export function withCsvImportSummary(draft: CardCsvImportDraft, importedRows: number | null = null): CardCsvImportDraft {
  return {
    ...draft,
    summary: buildSummary(draft.rows, draft.summary.headerSkipped, importedRows),
  };
}