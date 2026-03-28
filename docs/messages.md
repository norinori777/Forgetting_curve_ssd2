# Messages Reference

このファイルは、成功・失敗・バリデーション・補助文言などの共通メッセージ定義を管理する。
見出し、ボタン名、ラベル、プレースホルダーは各画面仕様と UI 実装側で管理する。

## study-card-create

| Key | Category | Default Text | Screens | Notes |
|-----|----------|--------------|---------|-------|
| `cardCreate.success.created` | success | カードを登録しました | `/cards`, `/cards/create` | 登録成功後にカード一覧で表示するフラッシュメッセージ |
| `cardCreate.error.submitFailed` | error | カードの登録に失敗しました。時間をおいて再試行してください。 | `/cards/create` | 想定外エラーの共通文言 |
| `cardCreate.error.collectionNotFound` | error | 選択したコレクションが見つかりません。再選択してください。 | `/cards/create` | コレクション整合性エラー |
| `cardCreate.validation.titleRequired` | validation | タイトルは必須です | `/cards/create` | 必須入力 |
| `cardCreate.validation.contentRequired` | validation | 学習内容は必須です | `/cards/create` | 必須入力 |
| `cardCreate.helper.tagInput` | helper | カンマ区切りで複数入力 | `/cards/create` | タグ入力補助 |
| `cardCreate.helper.unsavedChanges` | helper | 未保存の入力内容があります。このまま移動すると内容は失われます。 | `/cards/create` | 画面離脱時の注意喚起 |

## card-csv-import

| Key | Category | Default Text | Screens | Notes |
|-----|----------|--------------|---------|-------|
| `cardCsvImport.success.imported` | success | {{count}}件のカードを登録しました | `/cards`, `/cards/create` | CSV一括登録成功後にカード一覧で表示するフラッシュメッセージ |
| `cardCsvImport.error.validateFailed` | error | CSVの検証に失敗しました。内容を確認して再アップロードしてください。 | `/cards/create` | validate API 失敗または row-level business validation 失敗 |
| `cardCsvImport.error.importFailed` | error | CSVの一括登録に失敗しました。時間をおいて再試行してください。 | `/cards/create` | import API の想定外失敗 |
| `cardCsvImport.error.unsupportedEncoding` | error | 対応していない文字コードです。UTF-8、UTF-8 BOM、Shift_JIS のいずれかで保存してください。 | `/cards/create` | decode 失敗時 |
| `cardCsvImport.validation.fileRequired` | validation | CSVファイルを選択してください。 | `/cards/create` | ファイル未選択 |
| `cardCsvImport.validation.emptyRows` | validation | CSVに登録対象のデータ行がありません。 | `/cards/create` | ヘッダーのみまたは空ファイル |
| `cardCsvImport.validation.rowLengthMismatch` | validation | 5列のCSV形式で入力してください。回答列、タグ列、コレクション列も省略できません。 | `/cards/create` | 列数不足または過剰 |
| `cardCsvImport.validation.titleRequired` | validation | タイトルは必須です。 | `/cards/create` | 1列目必須 |
| `cardCsvImport.validation.contentRequired` | validation | 学習内容は必須です。 | `/cards/create` | 2列目必須 |
| `cardCsvImport.validation.collectionNotFound` | validation | 指定されたコレクションが見つかりません。 | `/cards/create` | 5列目の collection 名が不一致 |
| `cardCsvImport.helper.format` | helper | 1列目: タイトル、2列目: 学習内容、3列目: 回答、4列目: タグ、5列目: コレクション。タグはセミコロン区切り、学習内容の改行は \n で表現します。 | `/cards/create` | CSV 形式ガイド |
| `cardCsvImport.helper.supportedEncoding` | helper | 対応文字コード: UTF-8 / UTF-8 BOM / Shift_JIS | `/cards/create` | 文字コード案内 |
| `cardCsvImport.helper.importBlocked` | helper | エラーが1件でもある場合は一括登録できません。 | `/cards/create` | import ボタン無効時の補助 |

## collection-settings

| Key | Category | Default Text | Screens | Notes |
|-----|----------|--------------|---------|-------|
| `collectionSettings.success.created` | success | コレクションを登録しました。 | `/settings` | 新規登録成功 |
| `collectionSettings.success.updated` | success | コレクションを更新しました。 | `/settings` | 編集保存成功 |
| `collectionSettings.success.deleted` | success | コレクションを削除しました。 | `/settings` | 削除成功 |
| `collectionSettings.error.loadFailed` | error | コレクション一覧の取得に失敗しました。時間をおいて再試行してください。 | `/settings` | 初期一覧取得または再取得の失敗 |
| `collectionSettings.error.submitFailed` | error | コレクションの保存に失敗しました。時間をおいて再試行してください。 | `/settings` | create/update 共通失敗 |
| `collectionSettings.error.deleteFailed` | error | コレクションの削除に失敗しました。時間をおいて再試行してください。 | `/settings` | delete 共通失敗 |
| `collectionSettings.error.duplicateName` | error | 同じ名前のコレクションが既に存在します。別の名前を入力してください。 | `/settings` | owner 単位の重複エラー |
| `collectionSettings.error.collectionInUse` | error | カードが残っているコレクションは削除できません。 | `/settings` | 削除不可の API 応答 |
| `collectionSettings.validation.nameRequired` | validation | コレクション名は必須です | `/settings` | create/edit 共通必須入力 |
| `collectionSettings.validation.nameTooLong` | validation | コレクション名は60文字以内で入力してください。 | `/settings` | create/edit 共通文字数上限 |
| `collectionSettings.helper.description` | helper | 説明は任意です。設定画面で用途を識別しやすい内容を入力できます。 | `/settings` | 補足メモ入力の補助 |
| `collectionSettings.helper.deleteBlocked` | helper | カードが残っているため削除できません。先にカード側のコレクションを外してください。 | `/settings` | 削除不可時の説明 |
| `collectionSettings.helper.emptyState` | helper | まだコレクションがありません。最初のコレクションを作成して、学習カードを整理しやすくしましょう。 | `/settings` | 空状態の案内 |

## Maintenance Rules

- 文言を追加する場合は `Key`、`Category`、`Default Text`、`Screens`、`Notes` を必ず埋める
- 画面仕様は具体文言を直書きせず、このファイルの key と用途を参照する
- feature 固有であっても再利用可能な成功/失敗/補助文言はここに追記する