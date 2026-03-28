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