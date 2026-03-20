# data-model.md

## エンティティ

### Card（カード）

- Source: `prisma.schema` の `Card`、API の `ApiCard`
- Fields:
  - `id` (UUID)
  - `title` (string)
  - `content` (text)
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
  - `proficiency` は 0 以上の整数
  - `lastCorrectRate` は 0 以上 1 以下
  - `nextReviewAt`、`createdAt`、`updatedAt` は ISO 8601 文字列で API 返却する
  - 既定一覧では `isArchived = false` のカードのみを対象とする
- State transitions:
  - `Visible` -> `Archived`: バルクアーカイブ成功時に `isArchived = true`。次回一覧取得では表示対象から外れる
  - `Visible` -> `Deleted`: 削除確認後に物理削除される

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
  - `name` は必須、一意
  - フィルタ候補とバルクタグ操作の表示ラベルとして使用する

### Collection（コレクション）

- Source: `prisma.schema` の `Collection`
- Fields:
  - `id` (UUID)
  - `name` (string)
  - `ownerId` (UUID)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Relationships:
  - `cards`: 0..N `Card`
- Validation rules:
  - `name` は必須
  - 候補 API は最小情報として `id` と `label` を返す

### CardTag（中間テーブル）

- Source: `prisma.schema` の `CardTag`
- Fields:
  - `cardId` (UUID)
  - `tagId` (UUID)
- Constraints:
  - 複合主キー `(cardId, tagId)`
  - `createMany(skipDuplicates: true)` によりタグ追加は冪等

## 入出力モデル

### CardListFilter

- Source: `frontend/src/domain/cardList.ts`, `backend/src/domain/cardList.ts`
- Fields:
  - `q` (string | undefined)
  - `filter` (`today` | `overdue` | `unlearned` | undefined)
  - `sort` (`next_review_at` | `proficiency` | `created_at`)
  - `tagIds` (string[])
  - `collectionIds` (string[])
- Validation rules:
  - `filter` は単一選択
  - `sort` は必須。既定値は `next_review_at`
  - `tagIds`、`collectionIds` は空配列可
  - 複数フィルタは AND、同種複数値は OR 相当

### ListCardsQuery

- Source: `backend/src/schemas/cards.ts`
- Fields:
  - `cursor` (opaque string | undefined)
  - `limit` (int, default 50, min 1, max 200)
  - `q` (string | undefined)
  - `tagIds` (string[] | undefined) - CSV query から配列へ変換
  - `collectionIds` (string[] | undefined) - CSV query から配列へ変換
  - `filter` (`today` | `overdue` | `unlearned` | undefined)
  - `sort` (`next_review_at` | `proficiency` | `created_at`)
- Validation rules:
  - `cursor` は `sort` と整合する必要がある
  - 条件変更時は cursor をリセットする

### CursorPayload

- Source: `backend/src/schemas/cards.ts`
- Shapes:
  - `{ sort: 'next_review_at' | 'created_at', value: ISO datetime string, id: string }`
  - `{ sort: 'proficiency', value: number, id: string }`
- Purpose:
  - カーソル型とソート型の不一致を防ぎ、安定した順序で無限スクロールを継続する

### FilterOption

- Source: `backend/src/domain/cardList.ts`
- Fields:
  - `id` (UUID)
  - `label` (string)
  - `matchedBy` (`name` | `alias` | undefined)
- Purpose:
  - タグ / コレクション共用選択モーダルの候補表示

### FilterSelectionValue

- Source: `frontend/src/components/uniqueParts/FilterSelectionModal.tsx`
- Fields:
  - `tagIds` (string[])
  - `tagLabels` (string[])
  - `collectionIds` (string[])
  - `collectionLabels` (string[])
- Purpose:
  - モーダル内部のドラフト選択状態を保持し、適用時のみページ側フィルタへ反映する
- State transitions:
  - `Draft` -> `Applied`: 「適用」押下で `CardList` の filter state に反映
  - `Draft` -> `Cleared`: 現在ターゲットの「クリア」で対象側だけ空に戻す

### SelectionState

- Source: `frontend/src/hooks/useSelection.ts`
- Fields:
  - `selectedIds` (ID の集合)
  - `selectedItems` (ApiCard[])
  - `allSelected` (boolean)
- Invariants:
  - 現在描画されているカード集合に対してのみ有効
  - 検索、フィルタ、ソート変更時に全クリアされる

### BulkRequest

- Source: `backend/src/schemas/bulk.ts`
- Fields:
  - `action` (`archive` | `delete` | `addTags` | `removeTags`)
  - `cardIds` (string[], min 1)
  - `tagIds` (string[] | undefined)
- Validation rules:
  - `addTags` / `removeTags` では `tagIds` 必須
  - `archive` / `delete` では `tagIds` 不要
- Semantics:
  - `archive`: 成功後に既定一覧から除外される
  - `addTags`: 既に付与済みのタグは no-op 成功
  - `removeTags`: 未付与タグの削除は no-op 成功

### ReviewStartRequest / ReviewStartResponse

- Source: `backend/src/api/review.ts`
- Request fields:
  - `filter` (`CardListFilter` | undefined)
  - `cardIds` (string[] | undefined) - 一般 API 用に残るが、カード一覧画面では使用しない
- Response fields:
  - `sessionId` (UUID string)
  - `cardIds` (string[])
- Semantics:
  - カード一覧画面からは `filter` を送る
  - 選択状態は review 対象に影響しない

### TopLevelPage

- Purpose: ルート共通レイアウトで扱うページ定義
- Fields:
  - `path` (`/`, `/cards`, `/review`, `/stats`, `/settings`)
  - `label` (`ホーム`, `カード一覧`, `復習`, `統計`, `設定`)
  - `kind` (`home` | `card-list` | `placeholder`)
- Invariants:
  - パンくずは常に現在ページの `label` だけを表示する
  - ヘッダーとフッターは全ルートで共通

## リレーション

- Card 1 --- 0..1 Collection
- Card 1 --- 0..N CardTag
- Tag 1 --- 0..N CardTag
- CardListFilter 1 --- 0..N Tag
- CardListFilter 1 --- 0..N Collection

## インデックス / ページネーション設計

- `Card(nextReviewAt, id)` 複合インデックスを `next_review_at` ソートのカーソルページングに利用する
- `Card(collectionId)`、`Card(isArchived)`、`CardTag(cardId)`、`CardTag(tagId)` の既存インデックスを絞り込みとバルク更新に利用する
- `created_at` と `proficiency` では値 + `id` の安定順序を用いる

## 実装上の不変条件

- 既定一覧はアーカイブ済カードを表示しない
- query key の変更は選択全クリアと一覧再取得を引き起こす
- バルクタグ操作は同一入力の再試行で状態を壊さない
- ルート追加後も実データ画面は `/cards` のみとし、他ルートはプレースホルダー表示に留める
- テーマ値は `theme.json`、画面構成は `ascii_ui.txt` を正本とする
