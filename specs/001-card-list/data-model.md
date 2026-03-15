# data-model.md

## エンティティ

### Card（カード）
- `id` (UUID) — 主キー
- `title` (string) — 表示用タイトル
- `content` (text) — 本文／解説
- `collection_id` (UUID | null) — 所属コレクション
- `proficiency` (int) — 習熟度スコア
- `next_review_at` (timestamp) — 次回復習日時（検索／ソート／フィルタ対象）
- `last_correct_rate` (float) — 直近正答率
- `is_archived` (boolean) — アーカイブ済フラグ
- `created_at` (timestamp)
- `updated_at` (timestamp)
- relations: `tags: CardTag[]`, `collection: Collection?`

Validation rules:
- `title` は必須、1 文字以上
- `proficiency` は 0 以上の整数を想定
- `last_correct_rate` は 0.0 以上 1.0 以下
- `next_review_at` は ISO 8601 で返却する

### Tag（タグ）
- `id` (UUID)
- `name` (string, unique)
- `created_at`, `updated_at`

Validation rules:
- `name` は必須、一意
- 一覧フィルタ用の表示ラベルとして利用する

### Collection（コレクション）
- `id` (UUID)
- `name` (string)
- `owner_id` (UUID)
- `created_at`, `updated_at`
- relations: `cards: Card[]`

Validation rules:
- `name` は必須
- フィルタ候補 API では `id` と `name` を返す

### CardTag（中間テーブル）
- `card_id` (UUID)
- `tag_id` (UUID)

### ListFilter（API 入力モデル）
- `q` (string | undefined) — キーワード
- `filter` (`today` | `overdue` | `unlearned` | undefined)
- `sort` (`next_review_at` | `proficiency` | `created_at`)
- `tagIds` (UUID[])
- `collectionIds` (UUID[])
- `cursor` (opaque string | undefined)
- `limit` (number, default 50)

Validation rules:
- `tagIds` と `collectionIds` は空配列可
- `limit` は 1〜100 の範囲に制限
- `cursor` は base64 化した JSON を想定

### FilterOption（モーダル候補表示モデル）
- `id` (UUID)
- `label` (string)
- `matchedBy` (`name` | `alias` | undefined)

用途:
- タグ選択モーダル
- コレクション選択モーダル

## リレーション
- Card 1 --- 0..1 Collection
- Card 1 --- 0..N CardTag
- Tag 1 --- 0..N CardTag

## インデックス / ページネーション設計
- 既存の `Card(next_review_at, id)` 複合インデックスをカーソルページングに利用する
- `collection_id`、`is_archived`、`card_tags.card_id`、`card_tags.tag_id` の既存インデックスを絞り込みに利用する
- タイトル/本文検索は Postgres 全文検索または ILIKE ベースで開始し、必要なら GIN インデックスを追加する

## 状態遷移（概要）
- Card -> アーカイブ: ユーザ操作（単体／一括）で `is_archived = true`
- Card -> 削除: 仕様に従い物理削除
- ListFilter -> ReviewStartRequest: 現在の絞り込み条件をそのまま復習開始 API に引き渡す

## UI / テーマ関連モデル

### ThemeTokenSource（設計上の参照モデル）
- source: `specs/001-card-list/theme.json`
- sections: `colors`, `fontFamily`, `fontSize`, `spacing`, `borderRadius`, `screens`

用途:
- Tailwind CSS の `theme.extend` にマッピング
- 直書き CSS の代わりにクラス設計へ反映

### ScreenLayoutReference（設計上の参照モデル）
- source: `specs/001-card-list/ascii_ui.txt`
- regions:
	- 検索バー
	- フィルタ群
	- タグ/コレクション選択ボタン
	- ソート
	- 主要アクション
	- 選択バー
	- カード一覧
	- ローディング/空状態/エラー状態
	- 削除確認モーダル
	- タグ選択モーダル
	- コレクション選択モーダル

## 実装者向けの注意点
- フィルタ／検索／ソート条件が変わった場合、UI はカーソルをリセットして先頭から再取得すること
- 安定したカーソル実装のため、`{ nextReviewAt, id }` を JSON にして base64 化する方式を推奨する
- モーダル表示はラベル文字列、API 通信は `id` 配列を使い分けること
- Tailwind クラスは `theme.json` にあるトークンを優先し、局所的な例外以外で直書き CSS を追加しないこと

