# Quickstart: ホーム画面 ASCII UI デザイン

## 目的

`/` のホーム画面を、仕様と `ascii_ui.txt` に沿って実装し、4 指標サマリ、主要導線、recent activities、状態別 UI を確認する。

## 実装手順

1. backend に `GET /api/home` を追加する。
   - `backend/src/index.ts` に `homeRouter` を mount する。
   - cards と review sessions から `todayDueCount`、`overdueCount`、`unlearnedCount`、`streakDays` を集計する。
   - `recentActivities` は最大 3 件の `review_completed` / `review_started` / `card_created` を返す。
   - 失敗時は `503 { error: 'home_temporary_failure' }` を返す。

2. frontend に home API クライアントと DTO を追加する。
   - `frontend/src/services/api/homeApi.ts` を作成して `GET /api/home` を呼ぶ。
   - `frontend/src/domain/home.ts` に response 型を定義する。

3. `frontend/src/pages/Home.tsx` を実装する。
   - `theme.json` と既存 Tailwind token を利用してサマリ、主要導線、recent activities を描画する。
   - `firstUse`、`noReviewToday`、error の各分岐を実装する。
   - `復習を始める` は `startReview('today')` を呼び、返却 sessionId を `reviewSession.ts` の helper で `/review` に渡す。

4. 主要導線を既存 route 定義と合わせる。
   - カード一覧: `/cards`
   - 学習カード登録: `/cards/create`
   - 設定: `/settings`

## テスト

1. backend 契約テストを追加する。
   - `tests/backend/home.test.ts`
   - 正常系、first-use、no-review、activities 0/3/4 件、503、today/overdue の境界時刻を含める。

2. frontend 状態表示テストを追加する。
   - `tests/frontend/home.test.tsx`
   - 通常表示、初回利用、今日の復習なし、取得失敗、復習開始ボタンの挙動を検証する。

3. 必要なら E2E を追加する。
   - `/` 表示
   - ホーム summary 確認
   - `復習を始める` 実行
   - `/review?sessionId=...` 遷移確認

## 手動確認チェック

1. `/` を開くと 4 指標が表示される
2. `復習を始める` で today の review session が開始される
3. カード 0 件では初回利用メッセージと登録導線が表示される
4. 今日の復習対象 0 件では代替導線が表示される
5. API 失敗時に再試行導線が表示される
6. モバイル幅でも主要導線が見切れない

## 完了条件

- 仕様 `FR-001` から `FR-012` を満たす
- `ascii_ui.txt` の構成と一致する
- `test.md` の branch / boundary 要件を満たす自動テストが追加される