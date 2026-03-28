# data-model.md

## エンティティ

### CardCsvImportDraft

- Purpose: 学習カード登録画面で CSV 一括登録セクションの UI 状態を保持する
- Fields:
  - `mode` (`single` | `csv`)
  - `selectedFileName` (string | null)
  - `selectedFileSize` (number | null)
  - `detectedEncoding` (`utf-8` | `utf-8-bom` | `shift_jis` | null)
  - `phase` (`idle` | `parsing` | `parsed` | `validating` | `ready` | `importing` | `failed` | `succeeded`)
  - `rows` (`CardCsvImportRow[]`)
  - `issues` (`CardCsvImportIssue[]`)
  - `summary` (`CardCsvImportSummary`)
  - `generalErrorKey` (string | null)
- State transitions:
  - `idle` -> `parsing`: ファイル選択直後
  - `parsing` -> `parsed`: decode と CSV 構文解析成功
  - `parsed` -> `validating`: backend validate 呼び出し開始
  - `validating` -> `ready`: 行単位 issue 生成後、import 可否が確定
  - `ready` -> `importing`: 「一括登録する」押下
  - `importing` -> `succeeded`: import 成功
  - `parsing` / `validating` / `importing` -> `failed`: encoding、validation、network、database error

### CardCsvImportRow

- Purpose: CSV の 1 行分を UI と API で共通して扱う import 候補
- Fields:
  - `rowNumber` (integer, original CSV row number)
  - `title` (string)
  - `content` (string) - `\n` を実改行へ正規化した値
  - `answer` (string | null) - 第3カラム。空欄時は null
  - `tagCell` (string | null) - 第4カラムの元セル文字列
  - `tagNames` (string[]) - セミコロン区切りで正規化済みのタグ名
  - `collectionName` (string | null) - 第5カラム
  - `resolvedCollectionId` (UUID | null)
  - `status` (`valid` | `invalid`)
  - `issues` (`CardCsvImportIssue[]`)
- Validation rules:
  - `title` は trim 後 1 文字以上
  - `content` は trim 後 1 文字以上
  - `answer` は trim 後空文字なら null として扱う
  - 行の列数は常に 5
  - `tagNames` は空配列可、各要素は trim 後 1 文字以上
  - `collectionName` は空欄時 null、値がある場合は owner スコープ内 collection へ解決できる必要がある

### CardCsvImportIssue

- Purpose: 行またはファイル全体に対する修正必要箇所を表現する
- Fields:
  - `scope` (`file` | `row`)
  - `rowNumber` (integer | null)
  - `code` (`unsupported_encoding` | `row_length_mismatch` | `missing_optional_columns` | `title_required` | `content_required` | `collection_not_found` | `invalid_header` | `validation_failed`)
  - `messageKey` (string)
  - `messageText` (string)
  - `detail` (string | null)
- Invariants:
  - `scope = file` の場合 `rowNumber = null`
  - 同一 row に複数 issue を持てる
  - UI は issue code ではなく messageKey/messageText を優先表示する

### CardCsvImportSummary

- Purpose: プレビュー上部と完了メッセージで用いる件数要約
- Fields:
  - `totalRows` (integer)
  - `headerSkipped` (boolean)
  - `validRows` (integer)
  - `invalidRows` (integer)
  - `canImport` (boolean)
  - `importedRows` (integer | null)
- Invariants:
  - `validRows + invalidRows = totalRows`
  - `canImport = invalidRows === 0 && totalRows > 0`

### BulkCardImportValidationRequest

- Purpose: validate endpoint に送る正規化済み row payload
- Fields:
  - `rows` (`BulkCardImportRowInput[]`)

### BulkCardImportRowInput

- Fields:
  - `rowNumber` (integer)
  - `title` (string)
  - `content` (string)
  - `answer` (string | null)
  - `tagNames` (string[])
  - `collectionName` (string | null)
- Invariants:
  - `content` は UI 側で `\n` を改行へ変換後の値を送る
  - `answer` は空欄時 null に正規化して送る
  - `tagNames` は重複除去済み

### BulkCardImportValidationResponse

- Purpose: import 実行前に表示する authoritative validation 結果
- Fields:
  - `ok` (boolean, always true)
  - `summary` (`CardCsvImportSummary`)
  - `rows` (`CardCsvImportRow[]`)
  - `issues` (`CardCsvImportIssue[]`)

### BulkCardImportResponse

- Purpose: import 成功時の完了情報
- Fields:
  - `ok` (boolean, always true)
  - `importedCount` (integer)
  - `messageKey` (string)
- Invariants:
  - `importedCount` は request の valid row 数と一致する

### LearningCard

- Source: `prisma/schema.prisma` の `Card`
- Relevant fields:
  - `id` (UUID)
  - `title` (string)
  - `content` (text)
  - `answer` (text | null)
  - `collectionId` (UUID | null)
  - `proficiency` (int)
  - `nextReviewAt` (datetime)
  - `lastCorrectRate` (float)
  - `isArchived` (boolean)
- Import-specific rules:
  - CSV import では `answer` は CSV の第3カラムに値があれば保存し、空欄時は null とする
  - `proficiency = 0`, `lastCorrectRate = 0`, `nextReviewAt = now`, `isArchived = false`

### CollectionMatch

- Purpose: collection name を import 中に owner スコープで解決した結果
- Fields:
  - `ownerId` (UUID)
  - `collectionId` (UUID)
  - `name` (string)
  - `normalizedName` (string)
- Invariants:
  - `normalizedName = trim(name).toLocaleLowerCase('ja-JP')`

## リレーション

- CardCsvImportDraft 1 --- 0..N CardCsvImportRow
- CardCsvImportRow 1 --- 0..N CardCsvImportIssue
- CardCsvImportRow 0..1 --- 1 CollectionMatch
- BulkCardImportRowInput 1 --- 1 LearningCard (import 成功時)

## 実装上の不変条件

- raw CSV file 自体は永続化しない
- CSV import は DB schema を増やさず、既存 `Card`、`Tag`、`Collection`、`CardTag` を再利用する
- `collectionName` が空欄の row は collection 未設定として valid 扱い
- `answer` が空欄の row は回答未設定として valid 扱い
- 未登録 tag は issue にせず、import 時に新規作成して紐づける
- import endpoint は request 全体を 1 transaction として扱い、部分成功を残さない
- ヘッダー行は先頭 1 行のみ対象で、5 列が完全一致した場合だけ除外する
