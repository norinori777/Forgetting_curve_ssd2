# data-model.md

## エンティティ

### LearningCard（学習カード）

- Source: `prisma.schema` の `Card`、API の `ApiCard`
- Fields:
  - `id` (UUID)
  - `title` (string)
  - `content` (text)
  - `collectionId` (UUID | null)
  - `tags` (string[])
  - `proficiency` (int, 初期値 0)
  - `nextReviewAt` (datetime, 初期値は登録時刻)
  - `lastCorrectRate` (float, 初期値 0)
  - `isArchived` (boolean, 初期値 false)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Relationships:
  - `collection`: 0..1 `Collection`
  - `cardTags`: 0..N `CardTag`
- Validation rules:
  - `title` は必須、trim 後 1 文字以上
  - `content` は必須、trim 後 1 文字以上
  - `collectionId` は指定時のみ既存 `Collection.id` である必要がある
  - API 返却の日時は ISO 8601 文字列とする
- State transitions:
  - `Draft` -> `Created`: 登録成功時に永続化される
  - `Created` -> `VisibleInCardList`: 成功後の一覧再表示で確認可能になる

### Tag（タグ）

- Source: `prisma.schema` の `Tag`
- Fields:
  - `id` (UUID)
  - `name` (string, unique)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Relationships:
  - `cardTags`: 0..N `CardTag`
- Validation rules:
  - `name` は trim 後 1 文字以上
  - 同一名タグは一意制約により重複しない
- State transitions:
  - `Missing` -> `Created`: 登録画面で未登録タグが入力された場合に upsert で生成
  - `Existing` -> `Linked`: 学習カード作成時に中間テーブルで紐づく

### Collection（コレクション）

- Source: `prisma.schema` の `Collection`
- Fields:
  - `id` (UUID)
  - `name` (string)
  - `ownerId` (UUID)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Relationships:
  - `cards`: 0..N `LearningCard`
- Validation rules:
  - 登録画面では既存候補からの選択のみ
  - 選択されなくてもカード登録自体は可能

### CardTag（中間テーブル）

- Source: `prisma.schema` の `CardTag`
- Fields:
  - `cardId` (UUID)
  - `tagId` (UUID)
- Constraints:
  - 複合主キー `(cardId, tagId)`
  - カード作成トランザクションの一部として生成される

### CardCreateDraft（登録画面ドラフト）

- Purpose: 画面上で編集中の入力状態
- Fields:
  - `title` (string)
  - `content` (string)
  - `tagInput` (string) - カンマ区切りの入力文字列
  - `tagNames` (string[]) - 正規化済みタグ名の配列
  - `collectionId` (UUID | null)
  - `collectionLabel` (string | null)
  - `submitState` (`idle` | `submitting` | `failed`)
  - `fieldErrors` (`title` / `content` 単位のメッセージ key)
- State transitions:
  - `idle` -> `dirty`: いずれかの入力変更
  - `dirty` -> `submitting`: 「登録する」押下かつ検証成功
  - `submitting` -> `idle`: リセットまたはページ再初期化
  - `submitting` -> `failed`: API 失敗
  - `submitting` -> `succeeded`: 登録成功後にカード一覧へリダイレクト

### UiMessageDefinition（UIメッセージ定義）

- Purpose: `docs/messages.md` で管理する共通文言
- Fields:
  - `key` (string)
  - `category` (`success` | `error` | `validation` | `helper`)
  - `text` (string)
  - `screens` (string[]) - 利用画面一覧
  - `notes` (string | null)
- Invariants:
  - 見出し、ボタン名、ラベル、プレースホルダーは含めない
  - 成功/失敗/バリデーション/補助文言のみを対象とする

## 入出力モデル

### CreateCardRequest

- Source: `backend/src/schemas/cards.ts` に追加予定
- Fields:
  - `title` (string)
  - `content` (string)
  - `tagNames` (string[], default `[]`)
  - `collectionId` (UUID | null | undefined)
- Validation rules:
  - `title`、`content` は trim 後必須
  - `tagNames` は空配列可、各要素は trim 後 1 文字以上
  - `collectionId` は省略可だが、指定時は既存 collection に一致する必要がある

### CreateCardResponse

- Source: `POST /api/cards` response
- Fields:
  - `ok` (boolean, `true`)
  - `card` (`LearningCard` の API 返却形)
- Semantics:
  - 返却カードは一覧描画にそのまま使える shape を持つ
  - 成功後はクライアントがカード一覧へ遷移し、成功メッセージを表示する

### CreateCardError

- Fields:
  - `error` (`invalid_body` | `bad_request` | `database_error`)
  - `details` (Zod flatten output | undefined)
  - `message` (string | undefined)
- Purpose:
  - 必須入力不足、コレクション不一致、保存失敗を区別して UI へ返す

### CardListSuccessFlash

- Purpose: 登録成功後に一覧画面へ渡す一過性メッセージ状態
- Fields:
  - `messageKey` (string)
  - `createdCardId` (UUID | undefined)
- Invariants:
  - 一覧画面で一度表示後に破棄される

## リレーション

- LearningCard 1 --- 0..1 Collection
- LearningCard 1 --- 0..N CardTag
- Tag 1 --- 0..N CardTag
- CardCreateDraft 1 --- 0..1 Collection
- CardCreateDraft 1 --- 0..N Tag names

## 実装上の不変条件

- 登録画面でコレクション新規作成は行わない
- 未登録タグ名は保存時に新規タグとして作成可能である
- カード作成時は `card`、`tag`、`card_tags` の更新を同一トランザクションで行う
- 成功・失敗・バリデーション・補助文言は `docs/messages.md` を正本とする
- 見出し、ボタン名、ラベル、プレースホルダーは画面仕様と UI 実装に残す