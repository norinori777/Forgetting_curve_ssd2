# テスト実施要件（最低要件）

## 目的

- 全分岐テストと境界値テスト（前／一致／後）を必須とし、コアロジックの回帰を防止する。

## 適用範囲

- 単体テスト（Unit）: ビジネスロジック関数・サービス層（`backend/services/`, `backend/repositories/`, `frontend/src/services/api` 等）
- 統合テスト（Integration/Contract）: API 層と DB の連携（`backend/api/`）
- E2E（オプション）: ユーザーフロー（一覧→フィルタ→選択→復習開始）を Playwright 等で検証

## 必須要件

1. 全分岐テスト（Branch coverage）
   - 対象: if/else/switch/early-return/例外分岐を含む関数・メソッド
     - 目標: コアロジックはブランチカバレッジ100%（リポジトリ全体は目安85%）

2. 境界値テスト（Boundary value）
   - 日時/時刻境界（前 / 一致 / 後）
     - 例: `nextReviewAt` が 2026-03-06T23:59:59（前）、2026-03-07T00:00:00（一致）、2026-03-07T00:00:01（後）
       - UTC とローカル（JST 等）の両方で検証する
   - 数値境界
     - `intervalDays` の最小/最大/±1、`recentAccuracy` の 0／50／100 等
   - ページング境界
     - `page=1`, `page=last`, `page>last`, `per_page` の最小/最大/超過
   - バルク操作境界
     - 選択0件、1件、最大多数（例: 1000件）等での挙動とロールバック

3. 失敗／例外シナリオの網羅
   - 認可エラー、DBタイムアウト、ネットワークエラー、入力バリデーション失敗など各分岐を含める

## テストデータ設計

- 固定シード（fixtures）を用意し、UTC／ローカル双方の日時セットを含める
- 単体テストはモック（依存注入）、統合テストは PostgreSQL のテストコンテナを推奨

## テストケース定義フォーマット（必須）

- Title: 短い要点（例: "検索: nextReviewAt が境界日に等しい場合 表示されること")
- Given: 前提データや状態
- When: 実行する関数/API/操作
- Then: 期待結果（レスポンス/副作用/DB状態）
- Data: 使用する具体値（日時、数値）
- Tags: `branch`, `boundary`, `module` など

## 実装ガイド（推奨）

- テストフレームワーク: Unit → `vitest` / `jest`（TypeScript）、Integration → `supertest`、E2E → `playwright`
- モッキング: `vi`（Vitest）/`sinon`、フロントは `msw` を推奨
- テスト配置:
  - `backend/tests/unit/`、`backend/tests/integration/`
  - `frontend/src/**/__tests__/` または `frontend/tests/unit/`
- 命名規約: `{module}.{function}.spec.ts` 例: `items.service.computeNextReview.spec.ts`
- ヘルパー: `tests/fixtures/`, `tests/helpers/time.ts`（境界時刻生成）を用意

## CI 統合（推奨コマンド）

例（pnpm）:

```bash
pnpm install
pnpm test:unit
pnpm test:integration
pnpm test:e2e # 任意
```

- カバレッジ: `--coverage` を有効にし、コアモジュールのブランチカバレッジ閾値を CI で検証（未達は失敗）

## 受け入れ基準（DoD）

- 全てのコアロジックに対して全分岐テストが作成され成功していること
- 境界値テスト（日付・数値・ページング）が前/一致/後のケースで検証されていること
- CI が通り、カバレッジの閾値を満たすこと

## サンプルテストケース（テンプレ）

- 全分岐例:
  - Title: `computeNextReview — easeFactor 分岐: easeFactor < 1.3 の場合`
  - Given: `{ easeFactor: 1.2, intervalDays: 3 }`
  - When: `computeNextReview(card)` を呼ぶ
  - Then: 期待される分岐結果（日数/日時）

- 境界値（日付）例:
  - Title: `一覧: nextReviewAt が当日の 00:00:00 と一致する場合は今日の復習に含める`
  - Given: card `{ nextReviewAt: 2026-03-07T00:00:00Z }`（ユーザロケール JST）
  - When: GET `/api/items?due=today`
  - Then: レスポンスにカードが含まれる (HTTP 200)

## テスト方式

- 本ドキュメントに記載した要件・ケースに基づき、以下の方式でテストを実施します。
  - ローカル開発: 開発者は `pnpm test:unit` を実行して単体テストを確認する。
  - CI: プルリクエストごとに `pnpm test:unit && pnpm test:integration` を自動実行し、カバレッジ閾値を満たさない場合はマージ不可とする。
  - 統合テスト／E2E: スケジュールまたはリリース直前の CI パイプラインで Playwright 等による E2E を実行する（任意設定）。
  - モック/実 DB: 単体はモックで高速に、統合は PostgreSQL テストコンテナを用いて実DBで検証する。

- テスト報告: CI の結果は PR に表示し、失敗時は担当者が修正して再実行する。

## 性能確認（本機能の追加要件）

- review start は synthetic test でも p95 500ms 以内を目安に確認する
- Review 画面での次カード移動は synthetic test でも 100ms 未満の応答を目安に確認する
- 性能確認は `tests/perf/` に配置し、通常の unit test と同じコマンドで実行できるようにする
- 性能確認でも対象件数上限 200 件と start 後の notice 表示が回帰しないことを合わせて確認する

## 手動確認記録（2026-03-23）

- 実 DB に Prisma migration 適用後、localhost の backend / frontend 開発サーバーを起動して確認した
- カード一覧から `復習開始` を実行し、review session が作成されることを確認した
- Review 画面で `回答を表示` → `3 思い出せた` → `次へ` を進め、`review_session_cards` の `assessment` / `assessedAt` / `lockedAt` 更新を確認した
- 4 件の対象カードを最後まで進め、`review_sessions.status = completed`、`currentCardIndex = 4`、`completedAt` 記録ありを確認した
- 確認時の代表 session:
  - 作成確認: `1424f0df-8fb6-44a5-a170-a2e85dacc851`
  - 進行確認: `fedf3b4f-5383-4398-ba47-7a5d5a9e880e`
  - 完了確認: `8d1de7ab-33b2-4da8-8caf-3c6b74251b50`
- 補足: schema 変更後は `npx prisma generate` を実行して Prisma Client を再生成しないと review start が `review_temporary_failure` になることを確認した


