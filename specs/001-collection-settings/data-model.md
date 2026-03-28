# data-model.md

## エンティティ

### Collection（コレクション）

- Source: `prisma/schema.prisma` の `Collection`
- Fields:
  - `id` (UUID)
  - `name` (string)
  - `normalizedName` (string) - `lower(trim(name))`
  - `description` (text | null)
  - `ownerId` (UUID)
  - `createdAt` (datetime)
  - `updatedAt` (datetime)
- Relationships:
  - `cards`: 0..N `Card`
- Validation rules:
  - `name` は trim 後 1 文字以上
  - `normalizedName` は owner 単位で一意
  - `description` は null 可。指定時は trim 後に保存する
- State transitions:
  - `Draft` -> `Created`: 新規登録成功時
  - `Created` -> `Updated`: 編集モーダル保存時
  - `Created` -> `Deleted`: カード未所属かつ削除確認完了時

### CollectionManagementItem（管理一覧項目）

- Purpose: 設定画面の一覧 1 行分に必要な派生情報を保持する read model
- Fields:
  - `id` (UUID)
  - `name` (string)
  - `description` (string | null)
  - `cardCount` (int)
  - `updatedAt` (datetime)
  - `canDelete` (boolean)
  - `deleteBlockedReason` (string | null)
- Invariants:
  - `canDelete === false` のとき `cardCount > 0`
  - `deleteBlockedReason` は削除不可の理由を 1 つに決めた表示用文言 key または API message として返す

### CollectionCreateDraft（新規登録ドラフト）

- Purpose: 設定画面の新規登録フォーム状態
- Fields:
  - `name` (string)
  - `description` (string)
  - `fieldErrors` (`name` / `description` 単位)
  - `submitState` (`idle` | `submitting` | `failed`)
- State transitions:
  - `idle` -> `dirty`: いずれかの入力変更
  - `dirty` -> `submitting`: 登録押下かつ検証成功
  - `submitting` -> `idle`: 成功またはクリア
  - `submitting` -> `failed`: API 失敗

### CollectionEditDraft（編集ドラフト）

- Purpose: 編集モーダル内の一時状態
- Fields:
  - `collectionId` (UUID)
  - `name` (string)
  - `description` (string)
  - `fieldErrors` (`name` / `description` 単位)
  - `submitState` (`idle` | `submitting` | `failed`)
- Invariants:
  - モーダルは 1 度に 1 件だけ編集する
  - キャンセル時は一覧へ未保存変更を反映しない

### CollectionDeleteAttempt（削除試行）

- Purpose: 削除確認または削除不可メッセージの判定に使う command 入力
- Fields:
  - `collectionId` (UUID)
  - `cardCountAtDecision` (int)
  - `canDelete` (boolean)
- State transitions:
  - `ReadyToConfirm` -> `Deleted`: 再検証でも `canDelete === true`
  - `ReadyToConfirm` -> `Blocked`: 再検証で `canDelete === false`

## 入出力モデル

### ListManagedCollectionsResponse

- Endpoint: `GET /api/collections/manage`
- Fields:
  - `items` (`CollectionManagementItem[]`)
- Semantics:
  - Settings page の一覧表示を 1 回の取得で構成できる shape を返す

### CreateCollectionRequest

- Endpoint: `POST /api/collections/manage`
- Fields:
  - `name` (string)
  - `description` (string | null | undefined)
- Validation rules:
  - `name` は trim 後必須
  - `description` は省略可

### UpdateCollectionRequest

- Endpoint: `PATCH /api/collections/manage/{collectionId}`
- Fields:
  - `name` (string)
  - `description` (string | null | undefined)
- Validation rules:
  - `collectionId` は既存 collection に一致する必要がある
  - `name` は trim 後必須

### CollectionMutationResponse

- Endpoint: create / update の成功レスポンス
- Fields:
  - `ok` (boolean, `true`)
  - `collection` (`CollectionManagementItem`)

### DeleteCollectionResponse

- Endpoint: `DELETE /api/collections/manage/{collectionId}`
- Fields:
  - `ok` (boolean, `true`)
  - `deletedId` (UUID)

### CollectionMutationError

- Fields:
  - `error` (`invalid_body` | `duplicate_name` | `not_found` | `collection_in_use` | `database_error`)
  - `message` (string | null)
  - `details` (object | null)
- Semantics:
  - `duplicate_name` は owner 単位の正規化名重複
  - `collection_in_use` は削除不可ガード違反

## リレーション

- Collection 1 --- 0..N Card
- CollectionManagementItem 1 --- 1 Collection
- CollectionEditDraft 1 --- 1 Collection

## 実装上の不変条件

- 既存の `GET /api/collections` 候補検索 contract は維持する
- コレクション重複判定は owner 単位の `normalizedName` で統一する
- 削除はカード未所属のコレクションだけ許可する
- `canDelete` は UI ヒントであり、最終判定は backend が行う
- 新規登録フォームと編集モーダルは別 state として管理する
