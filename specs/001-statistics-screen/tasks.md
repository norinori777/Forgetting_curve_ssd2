# タスク: 統計画面 ASCII UI デザイン (feature/001-statistics-screen)

**入力**: `specs/001-statistics-screen/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`

**テスト**: この機能では `spec.md` の User Scenarios & Testing、`quickstart.md`、`test.md` に従い、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: セットアップ（共通基盤）

**Purpose**: 統計機能の実装先とテスト受け皿を揃え、後続タスクの編集対象を固定する

- [X] T001 backend/src/api/stats.ts、backend/src/repositories/statsRepository.ts、backend/src/schemas/stats.ts、frontend/src/domain/stats.ts、frontend/src/services/api/statsApi.ts、frontend/src/utils/statsDashboardStorage.ts の統計機能用スキャフォールドを作成する
- [X] T002 [P] frontend/src/components/uniqueParts/StatsRangeTabs.tsx、frontend/src/components/uniqueParts/StatsSummaryCard.tsx、frontend/src/components/uniqueParts/StatsTrendPanel.tsx、frontend/src/components/uniqueParts/StatsTagBreakdown.tsx、frontend/src/components/uniqueParts/StatsInsightPanel.tsx の UI スキャフォールドを作成する
- [X] T003 [P] tests/backend/stats.test.ts と tests/frontend/stats.test.tsx のテストスキャフォールドを作成する

**Checkpoint**: 統計機能の実装ファイル、UI 分割先、テスト配置先が揃う

---

## Phase 2: 基盤整備（着手前提）

**Purpose**: すべてのユーザーストーリーで共通利用する API 契約、DTO、router mount、ナビ導線、page composition、ローカルフォールバック基盤を整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T004 backend/src/index.ts と backend/src/api/stats.ts に stats router の mount と range query validation を実装する
- [X] T005 [P] backend/src/schemas/stats.ts と frontend/src/domain/stats.ts に共有 DTO と Zod schema を定義する
- [X] T006 [P] frontend/src/services/api/statsApi.ts と frontend/src/utils/statsDashboardStorage.ts に API client の parsing、error surface、最終成功 snapshot のローカルキャッシュを実装する
- [X] T007 [P] specs/001-statistics-screen/contracts/openapi.yaml と backend/contracts/openapi.yaml に stats API contract を同期する
- [X] T008 [P] frontend/src/utils/routes/topLevelPages.ts と frontend/src/components/uiParts/AppLayout.tsx に stats 画面へのトップレベルナビ導線を実装する
- [X] T009 [P] frontend/src/pages/Stats.tsx、frontend/src/components/uniqueParts/StatsRangeTabs.tsx、frontend/src/components/uniqueParts/StatsSummaryCard.tsx、frontend/src/components/uniqueParts/StatsTrendPanel.tsx、frontend/src/components/uniqueParts/StatsTagBreakdown.tsx、frontend/src/components/uniqueParts/StatsInsightPanel.tsx に再利用可能な stats page section composition を整える

**Checkpoint**: `/api/stats` の入口、frontend DTO/client、トップレベルナビ導線、stats 画面のセクション分割、ローカルフォールバック基盤が揃い、各ユーザーストーリーへ着手できる

---

## Phase 3: ユーザーストーリー 1 - 学習状況をひと目で把握する (Priority: P1) 🎯 MVP

**Goal**: 統計画面を開いた直後に、既定 7 日間の summary 4 指標と前期間比を確認できるようにする

**Independent Test**: トップレベルナビから `/stats` に到達し、初期表示で 7 日間が選択され、総学習カード数、レビュー完了数、平均正答率、連続学習日数が表示され、各 KPI の補足情報から同じ長さの直前期間との比較を説明できること

### ユーザーストーリー 1 のテスト

- [X] T010 [P] [US1] tests/backend/stats.test.ts に summary 集計、平均正答率の重み付け、連続学習日数、前期間境界の coverage を追加する
- [X] T011 [P] [US1] tests/frontend/stats.test.tsx にトップレベルナビからの到達、既定 7 日間の初期表示、summary card 描画、前期間比表示の coverage を追加する

### ユーザーストーリー 1 の実装

- [X] T012 [P] [US1] backend/src/repositories/statsRepository.ts に総カード数、レビュー完了数、平均正答率、連続学習日数の summary 集計 helper を実装する
- [X] T013 [P] [US1] backend/src/api/stats.ts と backend/src/schemas/stats.ts に GET /api/stats の summary response serialization と logging を実装する
- [X] T014 [P] [US1] frontend/src/components/uniqueParts/StatsSummaryCard.tsx に summary card presentation を実装する
- [X] T015 [US1] frontend/src/pages/Stats.tsx と frontend/src/services/api/statsApi.ts に summary request lifecycle、既定 7 日間の初期表示、KPI section rendering を統合する

**Checkpoint**: User Story 1 を単独で実行し、統計画面の summary 4 指標を説明できる

---

## Phase 4: ユーザーストーリー 2 - 期間別の変化を見比べる (Priority: P2)

**Goal**: range tabs を切り替えながら学習量と正答率の推移を同じ画面構成で見比べられるようにする

**Independent Test**: `/stats` で `今日`、`7日間`、`30日間`、`全期間` を切り替えたときに、selected range の表示と trend の bucket が更新されること

### ユーザーストーリー 2 のテスト

- [X] T016 [P] [US2] tests/backend/stats.test.ts に today、7d、30d、all の bucket と trend series coverage を追加する
- [X] T017 [P] [US2] tests/frontend/stats.test.tsx に range tab interaction、selected range 表示、trend panel update coverage を追加する

### ユーザーストーリー 2 の実装

- [X] T018 [P] [US2] backend/src/repositories/statsRepository.ts と backend/src/schemas/stats.ts に range parsing と time-bucketed volume/accuracy trend 集計を実装する
- [X] T019 [P] [US2] backend/src/api/stats.ts と frontend/src/domain/stats.ts に range query handling と selectedRange serialization を実装する
- [X] T020 [P] [US2] frontend/src/components/uniqueParts/StatsRangeTabs.tsx と frontend/src/pages/Stats.tsx に interactive range tabs を実装する
- [X] T021 [US2] frontend/src/components/uniqueParts/StatsTrendPanel.tsx と frontend/src/pages/Stats.tsx に各 range の volume/accuracy trend rendering を実装する

**Checkpoint**: User Story 2 を単独で実行し、期間切り替えと trend 更新を確認できる

---

## Phase 5: ユーザーストーリー 3 - 改善ポイントを見つける (Priority: P3)

**Goal**: タグ別内訳と deterministic insight から、次に見直すタグを判断できるようにする

**Independent Test**: `/stats?range=30d` を開くと、タグ別 reviewCount と averageAccuracy が表示され、最弱タグに基づく insight が 1 件以上表示されること

### ユーザーストーリー 3 のテスト

- [X] T022 [P] [US3] tests/backend/stats.test.ts にタグ別集計、最弱タグ選定、insight rule coverage を追加する
- [X] T023 [P] [US3] tests/frontend/stats.test.tsx に tag breakdown と insight rendering coverage を追加する

### ユーザーストーリー 3 の実装

- [X] T024 [P] [US3] backend/src/repositories/statsRepository.ts にタグ別 review 集計と最弱タグ検出を実装する
- [X] T025 [P] [US3] backend/src/repositories/statsRepository.ts と backend/src/schemas/stats.ts に deterministic な trend/focus insights を実装する
- [X] T026 [P] [US3] frontend/src/components/uniqueParts/StatsTagBreakdown.tsx と frontend/src/pages/Stats.tsx に tag breakdown rendering を実装する
- [X] T027 [US3] frontend/src/components/uniqueParts/StatsInsightPanel.tsx と frontend/src/pages/Stats.tsx に insight panel rendering と最弱タグ強調を実装する

**Checkpoint**: User Story 3 を単独で実行し、改善対象のタグを 1 つ以上特定できる

---

## Phase 6: 仕上げと横断対応

**Purpose**: 状態別表示、アクセシビリティ、ドキュメント、最終検証を横断的に整える

- [X] T028 [P] backend/src/repositories/statsRepository.ts、backend/src/api/stats.ts、backend/src/schemas/stats.ts に empty、partial、temporary-failure state handling を実装する
- [X] T029 [P] frontend/src/pages/Stats.tsx、frontend/src/components/uiParts/AsyncState.tsx、frontend/src/components/uiParts/RetryBanner.tsx、frontend/src/utils/statsDashboardStorage.ts に empty、partial、retry、ローカルフォールバック UI flow を実装する
- [X] T030 [P] frontend/src/pages/Stats.tsx に `/cards/create` と `/review` へ遷移する空状態 CTA を実装する
- [X] T031 [P] tests/frontend/stats.test.tsx に empty state CTA、キーボード到達性、モバイル縦積み、状態別 rendering、ローカルフォールバック coverage を追加する
- [X] T032 [P] specs/001-statistics-screen/ascii_ui.txt、docs/ascii_ui.md、specs/001-statistics-screen/quickstart.md、specs/001-statistics-screen/contracts/openapi.yaml、backend/contracts/openapi.yaml の最終ドキュメント同期を行う
- [X] T033 [P] frontend/src/stories/StatsSummaryCard.stories.tsx、frontend/src/stories/StatsRangeTabs.stories.tsx、frontend/src/stories/StatsTrendPanel.stories.tsx、frontend/src/stories/StatsTagBreakdown.stories.tsx、frontend/src/stories/StatsInsightPanel.stories.tsx に Storybook coverage を追加する
- [X] T034 package.json、backend/package.json、frontend/package.json、tests/backend/stats.test.ts、tests/frontend/stats.test.tsx を使って lint、unit/integration の最終検証を実行する

---

## 依存関係と実行順序

### フェーズ依存

- **セットアップ (Phase 1)**: 依存なし。すぐ開始できる
- **基盤整備 (Phase 2)**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **ユーザーストーリー 1 (Phase 3)**: Phase 2 完了後に開始できる。MVP の最小範囲
- **ユーザーストーリー 2 (Phase 4)**: Phase 2 完了後に開始できる。期間切り替えと trend 表示の観点で独立検証できる
- **ユーザーストーリー 3 (Phase 5)**: Phase 2 完了後に開始できる。タグ別内訳と insight の観点で独立検証できる
- **仕上げ (Phase 6)**: 実装対象のユーザーストーリー完了後に開始する

### ユーザーストーリー依存

- **User Story 1 (P1)**: 基盤整備のみ依存。統計画面 MVP
- **User Story 2 (P2)**: 基盤整備のみ依存。range tabs と trends の観点で単独検証できる
- **User Story 3 (P3)**: 基盤整備のみ依存。tag breakdown と insight の観点で単独検証できる

### 各ユーザーストーリー内の順序

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- repository / schema / API を先に整え、その後 UI 統合へ進む
- 各ストーリーが単独で通る状態を作ってから次の優先度へ進む

---

## 並列実行例

### User Story 1

```bash
Task: T010 tests/backend/stats.test.ts に summary 集計、平均正答率の重み付け、連続学習日数、前期間境界の coverage を追加する
Task: T011 tests/frontend/stats.test.tsx にトップレベルナビからの到達、既定 7 日間の初期表示、summary card 描画、前期間比表示の coverage を追加する
Task: T012 backend/src/repositories/statsRepository.ts に総カード数、レビュー完了数、平均正答率、連続学習日数の summary 集計 helper を実装する
Task: T014 frontend/src/components/uniqueParts/StatsSummaryCard.tsx に summary card presentation を実装する
```

### User Story 2

```bash
Task: T016 tests/backend/stats.test.ts に today、7d、30d、all の bucket と trend series coverage を追加する
Task: T017 tests/frontend/stats.test.tsx に range tab interaction、selected range 表示、trend panel update coverage を追加する
Task: T018 backend/src/repositories/statsRepository.ts と backend/src/schemas/stats.ts に range parsing と time-bucketed volume/accuracy trend 集計を実装する
Task: T020 frontend/src/components/uniqueParts/StatsRangeTabs.tsx と frontend/src/pages/Stats.tsx に interactive range tabs を実装する
```

### User Story 3

```bash
Task: T022 tests/backend/stats.test.ts にタグ別集計、最弱タグ選定、insight rule coverage を追加する
Task: T023 tests/frontend/stats.test.tsx に tag breakdown と insight rendering coverage を追加する
Task: T024 backend/src/repositories/statsRepository.ts にタグ別 review 集計と最弱タグ検出を実装する
Task: T026 frontend/src/components/uniqueParts/StatsTagBreakdown.tsx と frontend/src/pages/Stats.tsx に tag breakdown rendering を実装する
```

---

## 実装戦略

### MVP 優先（ユーザーストーリー 1 のみ）

1. Phase 1 を完了して stats feature のファイル配置とテスト受け皿を揃える
2. Phase 2 を完了して `/api/stats`、DTO、client、トップレベルナビ導線、画面分割の基盤を整える
3. Phase 3 を完了して summary 4 指標と前期間比を成立させる
4. User Story 1 を単独で検証してから次フェーズへ進む

### 段階的リリース

1. User Story 2 で期間切り替えと trend 比較を追加する
2. User Story 3 でタグ別内訳と insight を完成させる
3. 最後に状態別表示、Storybook、ドキュメント、アクセシビリティ、lint、unit/integration を整える
