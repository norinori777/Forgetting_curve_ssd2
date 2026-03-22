# data-model.md

## エンティティ

### Card（カード）

- Source: `prisma/schema.prisma` の `Card`、API の `ApiCard`
- Fields:
  - `id` (UUID)
  - `title` (string)
  - `content` (text)
  - `answer` (text | null)
  - `collectionId` (UUID | null)
  - `proficiency` (int)
  - `nextReviewAt` (datetime)
  - `lastCorrectRate` (float)
  - `isArchived` (boolean)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
  - `tags` (string[]) - API ではタグ名の配列として返す
- Relationships:
  - `collection`: 0..1 `Collection`
  - `cardTags`: 0..N `CardTag`
- Validation rules:
  - `title` は必須、1 文字以上
  - `content` は既存どおり本文として保持する
  - `answer` は任意。未入力は `null` または空相当として扱う
  - `answer` は複数行のプレーンテキストを許可し、装飾記法は解釈しない
  - `proficiency` は 0 以上の整数
  - `lastCorrectRate` は 0 以上 1 以下
  - `nextReviewAt`、`createdAt`、`updatedAt` は ISO 8601 文字列で API 返却する
  - 既定一覧では `isArchived = false` のカードのみを対象とする
- State transitions:
  - `WithoutAnswer` -> `WithAnswer`: 別 feature の登録導線または既存データ投入で `answer` が保存される
  - `WithAnswer` -> `WithoutAnswer`: 別 feature の編集導線またはデータ更新で `answer` が空になる
  - `Visible` -> `Archived`: 既存バルクアーカイブ成功時に `isArchived = true`

### AnswerDisplayPreference（回答表示設定）

- Source: クライアントローカル設定キー `fc.cardList.answerDisplayMode`
- Fields:
  - `mode` (`link` | `inline`)
- Validation rules:
  - 未設定または不正値は `link` にフォールバックする
  - 今回は read-only 参照のみを対象とし、設定 UI や API 更新は行わない
- Semantics:
  - `link`: 回答を持つカードは初期状態で回答リンクを表示する
  - `inline`: 回答を持つカードは初期状態で回答本文を表示する

### AnswerVisibilityState（一覧上の回答表示状態）

- Source: `frontend/src/pages/CardList.tsx`
- Fields:
  - `cardId` (string)
  - `isVisible` (boolean)
- Invariants:
  - `link` モードでは既定値 `false`、ユーザーがリンク押下したカードだけ `true` になる
  - `inline` モードでは回答を持つカードの既定値は `true` とみなす
  - カードごとに独立して管理し、他カードの状態を変更しない
  - 一覧再取得時は現在の `AnswerDisplayPreference` に従って再初期化する

### Tag（タグ）

- Source: `prisma/schema.prisma` の `Tag`
- Fields:
  - `id` (UUID)
  - `name` (string, unique)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Relationships:
  - `cardTags`: 0..N `CardTag`

### Collection（コレクション）

- Source: `prisma/schema.prisma` の `Collection`
- Fields:
  - `id` (UUID)
  - `name` (string)
  - `ownerId` (UUID)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Relationships:
  - `cards`: 0..N `Card`

## 入出力モデル

### ApiCard

- Source: `backend/src/repositories/cardRepository.ts`, `frontend/src/domain/cardList.ts`
- Fields:
  - `id` (string)
  - `title` (string)
  - `content` (string)
  - `answer` (string | null)
  - `tags` (string[])
  - `collectionId` (string | null)
  - `proficiency` (number)
  - `nextReviewAt` (ISO datetime string)
  - `lastCorrectRate` (number)
  - `isArchived` (boolean)
  - `createdAt` (ISO datetime string)
  - `updatedAt` (ISO datetime string)
- Validation rules:
  - `answer` は未登録時に `null`
  - 既存フィールドの必須性は変更しない

### CardListFilter

- Source: `frontend/src/domain/cardList.ts`, `backend/src/domain/cardList.ts`
- Fields:
  - `q` (string | undefined)
  - `filter` (`today` | `overdue` | `unlearned` | undefined)
  - `sort` (`next_review_at` | `proficiency` | `created_at`)
  - `tagIds` (string[])
  - `collectionIds` (string[])
- Semantics:
  - `q` は title / content / answer を横断検索する
  - その他の絞り込み仕様は 001-card-list を継承する

### ListCardsQuery

- Source: `backend/src/schemas/cards.ts`
- Fields:
  - `cursor` (opaque string | undefined)
  - `limit` (int, default 50, min 1, max 200)
  - `q` (string | undefined)
  - `tagIds` (string[] | undefined)
  - `collectionIds` (string[] | undefined)
  - `filter` (`today` | `overdue` | `unlearned` | undefined)
  - `sort` (`next_review_at` | `proficiency` | `created_at`)
- Validation rules:
  - `q` の入力 schema は既存のまま維持する
  - 検索対象に `answer` が追加されても cursor/sort の整合ルールは変えない

### ListCardsResponse

- Source: `backend/src/repositories/cardRepository.ts`, `frontend/src/domain/cardList.ts`
- Fields:
  - `items` (`ApiCard`[])
  - `nextCursor` (string | undefined)
- Semantics:
  - `items[].answer` が `null` の場合、frontend は未回答表示として扱う

### AnswerDisplayPreferenceValue

- Source: frontend preference service
- Fields:
  - `mode` (`link` | `inline`)
- Validation rules:
  - 既知値以外は `link` に正規化する

## リレーション

- Card 1 --- 0..1 Answer text
- Card 1 --- 0..1 Collection
- Card 1 --- 0..N CardTag
- Tag 1 --- 0..N CardTag
- CardListFilter 1 --- 0..N Tag
- CardListFilter 1 --- 0..N Collection
- AnswerDisplayPreference 1 --- 0..N Card initial visibility decisions

## インデックス / 検索設計

- 既存の `Card(nextReviewAt, id)` 複合インデックスとカーソルページングを維持する
- 回答検索は title / content と同じ `contains + insensitive` 条件に含め、既存の `q` 導線を拡張する
- 今回は全文検索専用 index や別検索基盤は追加しない

## 実装上の不変条件

- 回答が `null` のカードも既存カードと同様に一覧、復習開始、バルク操作の対象になる
- `link` モードではユーザー操作前に回答本文を表示しない
- 1 枚のカードで回答を表示しても、他カードの表示状態は変わらない
- `inline` モードでも回答は一覧で最大数行までに抑え、超過分は省略表示する
- 一覧再取得時は、その時点の `AnswerDisplayPreference` を再参照して既定表示を決める