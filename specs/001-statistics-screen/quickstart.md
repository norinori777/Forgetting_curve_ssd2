# Quickstart: 統計画面 ASCII UI デザイン

## 目的

`/stats` のプレースホルダーを、仕様と `ascii_ui.txt` に沿った統計画面へ置き換え、期間切り替え・KPI・推移・タグ別内訳・状態別表示を確認する。

## 実装手順

1. backend に `GET /api/stats` を追加する。
   - `backend/src/index.ts` に `statsRouter` を mount する。
   - `backend/src/schemas/stats.ts` に response schema と range parser を定義する。
   - `backend/src/repositories/statsRepository.ts` で `cards`、`review_session_cards`、`card_tags`、`tags` を集計する。
   - `range=today|7d|30d|all` を処理し、volume trend / accuracy trend / tag breakdown / insights を返す。
   - 全失敗時は `503 { error: 'stats_temporary_failure' }`、部分欠損時は `200` + `state.mode=partial` を返す。

2. frontend に stats API クライアントと DTO を追加する。
   - `frontend/src/domain/stats.ts` に response 型を定義する。
   - `frontend/src/services/api/statsApi.ts` を作成して `GET /api/stats?range=` を呼ぶ。
   - `frontend/src/utils/statsDashboardStorage.ts` に最後の成功 snapshot を保存し、取得失敗時のローカルフォールバックに使う。

3. `frontend/src/pages/Stats.tsx` を本実装に置き換える。
   - range tabs、summary cards、volume trend、accuracy trend、tag breakdown、insight panel を描画する。
   - 初期表示の既定期間は `7日間` にする。
   - loading では `AsyncState`、error では `RetryBanner` と再試行導線を使う。
   - empty / partial / error を仕様どおりに切り替える。
   - empty state では `/cards/create` と `/review` の CTA を表示する。

4. 画面固有 UI を `components/uniqueParts` に分離する。
   - `StatsRangeTabs.tsx`
   - `StatsSummaryCard.tsx`
   - `StatsTrendPanel.tsx`
   - `StatsTagBreakdown.tsx`
   - `StatsInsightPanel.tsx`

5. contract と root OpenAPI を同期する。
   - `specs/001-statistics-screen/contracts/openapi.yaml` を正とする。
   - 実装時に `backend/contracts/openapi.yaml` へ `/api/stats` を反映する。

## テスト

1. backend 契約・集計テストを追加する。
   - `tests/backend/stats.test.ts`
   - range ごとの正常系
   - `today / 7d / 30d / all` の境界時刻
   - `assessment` 重み付け
   - タグ別内訳
   - empty / partial / 503

2. frontend 状態表示テストを追加する。
   - `tests/frontend/stats.test.tsx`
   - 通常表示
   - range 切り替え
   - empty
   - partial
   - error
   - cached fallback

3. 必要なら E2E を追加する。
   - `/stats` を開く
   - `7日間` から `30日間` へ切り替える
   - KPI と trend 表示が更新される

## 手動確認チェック

1. `/stats` を開くと summary 4 指標が表示される
2. range tabs を切り替えると同じレイアウトのまま内容が更新される
3. タグ別内訳に件数と平均正答率が表示され、最弱タグが分かる
4. review 回答が 0 件なら空状態が表示される
5. accuracy 系だけ欠損した場合でも volume trend と案内文が表示される
6. API 失敗時に再試行できる
7. API 失敗時にキャッシュがあれば前回取得分を表示できる
8. モバイル幅で KPI と range tabs が崩れない

## 完了条件

- `FR-001` から `FR-018` を満たす
- `ascii_ui.txt` の標準状態と状態バリエーションに整合する
- `test.md` の branch / boundary 要件を満たす自動テストが追加される
