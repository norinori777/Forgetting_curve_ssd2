# Card List API

Source of truth: `backend/contracts/openapi.yaml`

## Endpoints

### GET /api/cards

カード一覧をカーソル方式で取得します。

Query params:
- `cursor` (string, optional): 次ページ取得用の不透明トークン（レスポンスの `nextCursor` を利用）
- `limit` (number, optional, default=50)
- `q` (string, optional): タイトル/本文の部分一致検索
- `tags` (string, optional): カンマ区切り（タグ名またはタグID）
- `collection` (string, optional): collection id
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

### POST /api/cards/bulk

一括操作を行います。

Request:
```json
{
  "action": "archive",
  "cardIds": ["..."],
  "tags": ["..."]
}
```

- `action`: `archive` / `delete` / `addTags` / `removeTags`
- `tags`: タグ操作の場合のみ必須

### POST /api/review/start

現在の絞り込み条件（または明示的なID一覧）から復習セッションを開始します。

Request:
```json
{
  "filter": {
    "filter": "today",
    "q": "apple",
    "tags": "tag1,tag2",
    "collection": "...",
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
