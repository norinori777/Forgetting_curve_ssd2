 # data-model.md

## エンティティ

### Card（カード）
- `id` (UUID) — 主キー
- `title` (string) — 表示用タイトル
- `content` (text) — 本文／解説
- `tags` — `card_tags` を介したリレーション
- `collection_id` (UUID | null) — 所属コレクション
- `proficiency` (number) — 習熟度スコア（例: 0–100）
- `next_review_at` (timestamp) — 次回復習日時（検索／ソート／フィルタ対象）
- `last_correct_rate` (float) — 直近正答率
- `is_archived` (boolean) — アーカイブ済フラグ
- `created_at` (timestamp)
- `updated_at` (timestamp)

### インデックス / ページネーション設計
- カーソルページング: `next_review_at` と `id` の組み合わせをカーソルとして利用することで、安定したソートと重複排除を実現します。
- 検索インデックス: タイトルの全文検索には Postgres の GIN インデックスを推奨。タグ絞り込み用に `card_tags.card_id` にインデックスを張ること。

### Tag（タグ）
- `id` (UUID)
- `name` (string)
- `created_at`, `updated_at`

### Collection（コレクション）
- `id` (UUID)
- `name` (string)
- `owner_id` (UUID)
- `created_at`, `updated_at`

### CardTag（中間テーブル）
- `card_id` (UUID)
- `tag_id` (UUID)


## 状態遷移（概要）
- カード -> アーカイブ: ユーザ操作（単体／一括）で `is_archived=true` を設定
- カード -> 削除: 仕様に従い物理削除（行を削除）。バックアップ／アーカイブの扱いは憲法に従って設計すること


## 実装者向けの注意点
- フィルタ／検索／ソート条件が変わった場合、UI はカーソルをリセットして先頭から再取得すること
- 安定したカーソル実装のため、`{next_review_at, id}` を JSON としてエンコードし base64 化して `cursor` として扱う方式を推奨

