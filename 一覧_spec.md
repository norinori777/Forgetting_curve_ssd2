---
title: 忘却曲線アプリ — 一覧（List）
status: draft
owner: TBD
version: 0.1.0
tags: [list, ui, api, speckit.specify]
---

## 概要

学習カードの一覧画面。検索・フィルタ・ソート・バルク操作を提供し、復習セッションへの遷移を容易にする。

## ゴール

- ユーザが今日復習すべきカードを素早く見つけて復習を開始できること。
- 一覧上で次回復習日時・マスタリーレベル・直近正答率を一目で把握できること。

## スコープ

IN: 一覧表示、検索、フィルタ、ソート、ページネーション/無限スクロール、バルク操作、復習開始遷移、空状態/ローディング/エラー表示。
OUT: カードの詳細編集画面（別Specで扱う）、復習アルゴリズム本体の定義（別Specで扱う）。

## 受け入れ基準 (AC)

- AC-1: 一覧が取得でき、各行に `title, tags, nextReviewAt, masteryLevel, recentAccuracy` が表示される。
- AC-2: 検索（タイトル/本文/タグ）で期待する結果が返る。
- AC-3: フィルタ（今日の復習／期限切れ／未学習／タグ／コレクション）が動作する。
- AC-4: バルク操作（復習開始、タグ付与/削除、アーカイブ、削除）が動作し、削除は二段階確認を行う。
- AC-5: 空一覧・ローディング・エラー状態のUIとCTAが存在する。
- AC-6: キーボード操作（行選択、バルク操作、復習開始）に主要機能が対応する。

## 主要データモデル（一覧で使用）

- id: string
- title: string
- front: string (省略可)
- tags: string[]
- collectionId: string
- nextReviewAt: ISO8601
- lastReviewedAt: ISO8601 | null
- intervalDays: number
- easeFactor: number
- repetitionCount: number
- masteryLevel: integer (0-5)
- recentAccuracy: number (0-100)
- isArchived: boolean
- createdAt, updatedAt: ISO8601

## 主要API（概要）

- GET /api/items
  - query: q, tags[], collectionId, due, page, per_page, sort_by, sort_dir
  - returns: { items[], total, page, per_page }
- POST /api/items/bulk
  - body example: { ids: [...], action: "archive" | "start_review" | "delete", add_tags?: [], remove_tags?: [] }
- PATCH /api/items/{id}
- DELETE /api/items/{id} (基本ソフトデリート)

## UI要点

- ヘッダにグローバル検索、新規作成、インポート/エクスポート。
- サイドバーにタグ／コレクション／プリセットフィルタ（任意）。
- 各行に: チェックボックス、タイトル、タグ表示、次回復習日時（相対＋絶対）、マスタリーレベル、直近正答率、アクションボタン（復習／編集／削除）。
- 空一覧のCTA: 新規作成、サンプルインポート。

## 非機能要件・制約

- 応答性: 一覧初期応答 ≤ 2秒（ローディング含む）。
- スケーラビリティ: 10万件クラスのデータを想定したページネーション／クエリ最適化。
- セキュリティ: 編集/削除は認可チェック。APIは認証トークン必須。
- 国際化: 日付/時刻はローカル表示、ja/en の文言管理。

## 計測イベント

- list_view_opened { userId, filter, sort }
- item_review_started { itemId, source }
- item_deleted { itemId, method }
- bulk_action_performed { action, count }

## テストケース

- 検索でタイトルの一部を入力 → 正しいカードのみ表示。
- 「今日の復習」フィルタ適用 → nextReviewAt が当日以前のみ表示。
- 50件超でページネーション動作確認。
- 5件を選択してアーカイブ → isArchived=true。

## 開発ノート / 備考

- 詳細なテストケース、分析イベントの完全定義、アクセシビリティチェックリストは別ファイル(test.md / analytics.md / a11y.md)に分割することを推奨。
