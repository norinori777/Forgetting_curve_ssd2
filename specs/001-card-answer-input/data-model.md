# data-model.md

## エンティティ

### LearningCard（学習カード）

- Source: `prisma/schema.prisma` の `Card`、create API response の `card`
- Fields:
  - `id` (UUID)
  - `title` (string)
  - `content` (text)
  - `answer` (text | null)
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
  - `title` は trim 後 1 文字以上の必須
  - `content` は trim 後 1 文字以上の必須
  - `answer` は任意。未入力または空白のみは `null`
  - `answer` に値がある場合は複数行 plain text を保持し、改行を維持する
  - `collectionId` は指定時のみ既存 collection と一致する必要がある
- State transitions:
  - `Draft` -> `CreatedWithAnswer`: 回答付きで登録成功
  - `Draft` -> `CreatedWithoutAnswer`: 回答未登録で登録成功

### AnswerInput（回答入力）

- Purpose: 登録画面上でユーザーが入力する任意回答
- Fields:
  - `rawValue` (string)
  - `normalizedValue` (string | null)
- Validation rules:
  - `rawValue` は複数行を許可
  - `trim()` 後に空の場合 `normalizedValue = null`
  - 空白のみでなければ改行を含む元のテキストを保持する

### CardCreateDraft（登録画面ドラフト）

- Source: `frontend/src/domain/cardCreate.ts`
- Fields:
  - `title` (string)
  - `content` (string)
  - `answer` (string)
  - `tagInput` (string)
  - `tagNames` (string[])
  - `collectionId` (UUID | null)
  - `collectionLabel` (string | null)
  - `submitState` (`idle` | `submitting` | `failed`)
  - `fieldErrors` (`title?`, `content?`)
- Invariants:
  - 回答欄は `fieldErrors` の必須判定対象に含まれない
  - submit failure 時も `answer` は保持される
  - preview では `answer` 全文を表示する

### CreateCardRequest

- Source: `backend/src/schemas/cards.ts`, `frontend/src/domain/cardCreate.ts`
- Fields:
  - `title` (string)
  - `content` (string)
  - `answer` (string | null | undefined)
  - `tagNames` (string[])
  - `collectionId` (UUID | null | undefined)
- Validation rules:
  - `title`、`content` は trim 後必須
  - `answer` は省略可。空白のみは未登録として正規化
  - `tagNames` は空配列可

### CreateCardResponse

- Source: `POST /api/cards`
- Fields:
  - `ok` (true)
  - `card` (LearningCard API shape)
- Invariants:
  - `card.answer` は nullable
  - 一覧復帰時の flash 生成に必要な `card.id` を含む

### UiMessageDefinition

- Source: `docs/messages.md`
- Fields:
  - `key` (string)
  - `category` (`success` | `error` | `validation` | `helper`)
  - `text` (string)
  - `screens` (string[])
  - `notes` (string | null)
- Invariants:
  - 回答欄追加のために新規 message を増やす場合も、この形に従う
  - ラベルやプレースホルダーは含めない

## リレーション

- LearningCard 1 --- 0..1 Collection
- LearningCard 1 --- 0..N CardTag
- Tag 1 --- 0..N CardTag
- CardCreateDraft 1 --- 0..1 normalized AnswerInput

## 実装上の不変条件

- 回答欄が未入力または空白のみでもカード登録は成功できる
- 回答に値がある場合、改行は保持される
- 登録前プレビューでは回答全文を表示する
- 回答欄追加によって title / content / tag / collection の既存フローは変えない
- create API response は `answer` を含むが、一覧表示や検索対象追加はこの feature の責務に含めない