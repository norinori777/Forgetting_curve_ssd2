# Card List API

Source of truth: `backend/contracts/openapi.yaml`

## Routes

- `GET /` はホームのプレースホルダーを返す SPA ルートです
- `GET /cards` が実データに接続されたカード一覧ページです
- `GET /review` / `GET /stats` / `GET /settings` は今回の範囲ではプレースホルダーです

## Endpoints

### GET /api/cards

カード一覧をカーソル方式で取得します。

Query params:

- `cursor` (string, optional): 次ページ取得用の不透明トークン（レスポンスの `nextCursor` を利用）
- `limit` (number, optional, default=50)
- `q` (string, optional): タイトル/本文の部分一致検索
- `tagIds` (string, optional): カンマ区切りのタグID
- `collectionIds` (string, optional): カンマ区切りのコレクションID
- `filter` (string, optional): `today` / `overdue` / `unlearned`
- `sort` (string, optional): `next_review_at` / `proficiency` / `created_at`

Response (200):

```json
{
  "items": [{ "id": "...", "title": "..." }],
  "nextCursor": "..."
}
```

Notes:

- `filter=today` は「当日終了時刻までに期限到来したカード（今日以前）」を対象とします。
- `sort` / `q` / `tagIds` / `collectionIds` / `filter` のいずれかが変わると、クライアントは選択状態とカーソルをリセットして先頭から再取得します。

### POST /api/cards

学習カード登録画面から新規カードを作成します。

Request:

```json
{
  "title": "英単語セットA",
  "content": "photosynthesis = 光合成",
  "tagNames": ["英語", "基礎"],
  "collectionId": "11111111-1111-1111-1111-111111111111"
}
```

- `title` / `content`: 必須
- `tagNames`: 任意、未登録タグは自動作成されます
- `collectionId`: 任意、既存コレクションのみ指定可能です

Response (200):

```json
{
  "ok": true,
  "card": {
    "id": "...",
    "title": "英単語セットA"
  }
}
```

Notes:

- コレクション新規作成はこの endpoint の範囲外です。
- 保存失敗時は入力内容を保持したままクライアント側で再試行できます。

### GET /api/tags

共用フィルタモーダル用のタグ候補を取得します。

Query params:

- `q` (string, optional): タグ名の絞り込み
- `limit` (number, optional, default=20)

### GET /api/collections

共用フィルタモーダル用のコレクション候補を取得します。

Query params:

- `q` (string, optional): コレクション名の絞り込み
- `limit` (number, optional, default=20)

### POST /api/cards/bulk

一括操作を行います。

Request:

```json
{
  "action": "archive",
  "cardIds": ["..."],
  "tagIds": ["..."]
}
```

- `action`: `archive` / `delete` / `addTags` / `removeTags`
- `tagIds`: タグ操作の場合のみ必須

Notes:

- `archive` 成功後、クライアントは再取得によって対象カードを既定一覧から即時に除外します。
- `addTags` / `removeTags` は冪等です。すでに付いているタグの追加、未付与タグの削除は成功扱いの no-op です。

### POST /api/review/start

現在の絞り込み条件（または明示的なID一覧）から復習セッションを開始します。

Request:

```json
{
  "filter": {
    "filter": "today",
    "q": "apple",
    "tagIds": ["tag1", "tag2"],
    "collectionIds": ["..."],
    "sort": "next_review_at"
  }
}
```

Response (200):

```json
{
  "sessionId": "...",
  "cardIds": ["..."]
}
```

Notes:

- カード一覧ページからは常に現在の絞り込み条件を `filter` として送信し、選択状態は送信しません。
