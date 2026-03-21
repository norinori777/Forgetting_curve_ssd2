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

## Maintenance Rules

- 文言を追加する場合は `Key`、`Category`、`Default Text`、`Screens`、`Notes` を必ず埋める
- 画面仕様は具体文言を直書きせず、このファイルの key と用途を参照する
- feature 固有であっても再利用可能な成功/失敗/補助文言はここに追記する