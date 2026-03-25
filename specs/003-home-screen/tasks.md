# タスク: ホーム画面 ASCII UI デザイン (003-home-screen)

**入力**: `specs/003-home-screen/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`

**テスト**: この機能では `spec.md` の User Scenarios & Testing、`quickstart.md`、`test.md` に従い、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: home feature の実装先とテスト受け皿を揃え、後続タスクの編集対象を固定する

- [X] T001 Create home feature scaffolds in backend/src/api/home.ts, backend/src/repositories/homeRepository.ts, backend/src/schemas/home.ts, frontend/src/domain/home.ts, and frontend/src/services/api/homeApi.ts
- [X] T002 [P] Create home UI scaffolds in frontend/src/components/uniqueParts/HomeSummaryCard.tsx, frontend/src/components/uniqueParts/HomePrimaryActions.tsx, frontend/src/components/uniqueParts/HomeRecentActivities.tsx, and frontend/src/components/uniqueParts/HomeStatePanel.tsx
- [X] T003 [P] Create home test scaffolds in tests/backend/home.test.ts, tests/frontend/home.test.tsx, and tests/e2e/home-screen.spec.ts

**Checkpoint**: home feature の実装ファイル、UI 分割先、テスト配置先が揃う

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーで共通利用する API 契約、DTO、router mount、client 基盤を整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T004 Mount the home router and shared temporary-failure handling in backend/src/index.ts and backend/src/api/home.ts
- [X] T005 [P] Define shared home DTO and validation shapes in backend/src/schemas/home.ts and frontend/src/domain/home.ts
- [X] T006 [P] Implement the home API client base parsing and error surface in frontend/src/services/api/homeApi.ts and frontend/src/pages/Home.tsx
- [X] T007 [P] Sync the home dashboard contract in backend/contracts/openapi.yaml and specs/003-home-screen/contracts/openapi.yaml
- [X] T008 [P] Establish reusable home section composition in frontend/src/pages/Home.tsx and frontend/src/components/uniqueParts/HomeSummaryCard.tsx, frontend/src/components/uniqueParts/HomePrimaryActions.tsx, frontend/src/components/uniqueParts/HomeRecentActivities.tsx, and frontend/src/components/uniqueParts/HomeStatePanel.tsx

**Checkpoint**: `/api/home` の入口、frontend DTO/client、home 画面のセクション分割が揃い、各ユーザーストーリーへ着手できる

---

## Phase 3: User Story 1 - 今日やることをひと目で把握する (Priority: P1) 🎯 MVP

**Goal**: ホーム画面を開いた直後に 4 指標の学習サマリと主要導線を確認し、今日の復習を開始できるようにする

**Independent Test**: `/` を開くと todayDueCount、overdueCount、unlearnedCount、streakDays が表示され、`復習を始める` から今日の対象だけで review session が始まること

### Tests for User Story 1

- [X] T009 [P] [US1] Add home summary boundary coverage and today review-start contract checks in tests/backend/home.test.ts and tests/backend/review.test.ts
- [X] T010 [P] [US1] Add standard dashboard rendering and today review CTA coverage in tests/frontend/home.test.tsx
- [X] T011 [P] [US1] Add MVP home summary to review-start journey coverage in tests/e2e/home-screen.spec.ts

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement summary aggregation and baseline state resolution in backend/src/repositories/homeRepository.ts
- [X] T013 [P] [US1] Implement the summary response contract for GET /api/home in backend/src/api/home.ts and backend/src/schemas/home.ts
- [X] T014 [P] [US1] Implement dashboard summary cards and primary CTA layout in frontend/src/pages/Home.tsx, frontend/src/components/uniqueParts/HomeSummaryCard.tsx, and frontend/src/components/uniqueParts/HomePrimaryActions.tsx
- [X] T015 [US1] Wire today-only review start navigation in frontend/src/pages/Home.tsx, frontend/src/services/api/reviewApi.ts, and frontend/src/utils/routes/reviewSession.ts

**Checkpoint**: User Story 1 を単独で実行し、ホームから今日の復習へ進める

---

## Phase 4: User Story 2 - 主要な操作へ迷わず移動する (Priority: P2)

**Goal**: 主要導線の役割が明確で、recent activities 3 件を見ながら次の操作を判断できるようにする

**Independent Test**: ホーム画面で復習開始、カード一覧、学習カード登録、設定の導線を区別でき、recent activities が新しい順に最大 3 件表示されること

### Tests for User Story 2

- [X] T016 [P] [US2] Add recent activity ordering and limit coverage in tests/backend/home.test.ts
- [X] T017 [P] [US2] Add primary-action routing and recent activity rendering coverage in tests/frontend/home.test.tsx
- [X] T018 [P] [US2] Add home navigation and recent activity journey coverage in tests/e2e/home-screen.spec.ts

### Implementation for User Story 2

- [X] T019 [P] [US2] Implement recent activity query, ordering, and label composition in backend/src/repositories/homeRepository.ts
- [X] T020 [P] [US2] Extend home response serialization for recent activities in backend/src/api/home.ts, backend/src/schemas/home.ts, and frontend/src/domain/home.ts
- [X] T021 [US2] Render recent activities and route-aware major action cards in frontend/src/pages/Home.tsx, frontend/src/components/uniqueParts/HomeRecentActivities.tsx, and frontend/src/components/uniqueParts/HomePrimaryActions.tsx

**Checkpoint**: User Story 2 を単独で実行し、主要導線と recent activities から次の操作を判断できる

---

## Phase 5: User Story 3 - 状態に応じた案内を受ける (Priority: P3)

**Goal**: 初回利用、今日の復習なし、取得失敗の各状態で、適切な案内文と再行動導線を提示する

**Independent Test**: カード 0 件、todayDueCount 0 件、API 503 の各条件で、対応する state panel と次アクションが表示されること

### Tests for User Story 3

- [X] T022 [P] [US3] Add first-use, no-review-today, empty-activity, and temporary-failure coverage in tests/backend/home.test.ts
- [X] T023 [P] [US3] Add first-use, no-review, retry, and keyboard-only action reachability coverage in tests/frontend/home.test.tsx
- [X] T024 [P] [US3] Add first-use, no-review, and fetch-failure journeys in tests/e2e/home-screen.spec.ts

### Implementation for User Story 3

- [X] T025 [P] [US3] Implement first-use and no-review-today state derivation plus temporary-failure mapping in backend/src/repositories/homeRepository.ts and backend/src/api/home.ts
- [X] T026 [P] [US3] Implement state-specific guidance panels and retry affordances in frontend/src/components/uniqueParts/HomeStatePanel.tsx and frontend/src/pages/Home.tsx
- [X] T027 [US3] Ensure mobile stacking and keyboard access for all primary actions in frontend/src/pages/Home.tsx, frontend/src/components/uniqueParts/HomePrimaryActions.tsx, and frontend/src/components/uniqueParts/HomeStatePanel.tsx

**Checkpoint**: User Story 3 を単独で実行し、状態別の案内と再行動導線を確認できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント、Storybook、性能、最終検証を横断的に整える

- [X] T028 [P] Sync final home documentation in specs/003-home-screen/ascii_ui.txt, specs/003-home-screen/quickstart.md, specs/003-home-screen/contracts/openapi.yaml, and backend/contracts/openapi.yaml
- [X] T029 [P] Add Storybook coverage for home sections in frontend/src/stories/HomeSummaryCard.stories.tsx, frontend/src/stories/HomePrimaryActions.stories.tsx, frontend/src/stories/HomeRecentActivities.stories.tsx, and frontend/src/stories/HomeStatePanel.stories.tsx
- [X] T030 [P] Add home screen accessibility and performance coverage in frontend/accessibility-audit.md and tests/perf/home-screen.perf.test.tsx
- [X] T031 Run lint, unit/integration, and E2E validation via package.json, backend/package.json, frontend/package.json, tests/backend/home.test.ts, tests/frontend/home.test.tsx, and tests/e2e/home-screen.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。すぐ開始できる
- **Foundational (Phase 2)**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **User Story 1 (Phase 3)**: Phase 2 完了後に開始できる。MVP の最小範囲
- **User Story 2 (Phase 4)**: Phase 2 完了後に開始できる。US1 の summary/CTA 基盤を再利用するが、recent activities と主要遷移の観点で独立検証できる
- **User Story 3 (Phase 5)**: Phase 2 完了後に開始できる。状態分岐の観点で独立検証できる
- **Polish (Phase 6)**: 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- **User Story 1 (P1)**: Foundational のみ依存。ホーム画面 MVP
- **User Story 2 (P2)**: Foundational のみ依存。US1 の CTA 表示を再利用しても、recent activities と遷移判断の観点で単独検証できる
- **User Story 3 (P3)**: Foundational のみ依存。初回利用、no-review、error state を単独検証できる

### Within Each User Story

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- repository / schema / API を先に整え、その後 UI 統合へ進む
- 各ストーリーが単独で通る状態を作ってから次の優先度へ進む

---

## Parallel Examples

### User Story 1

```bash
Task: T009 Add home summary boundary coverage and today review-start contract checks in tests/backend/home.test.ts and tests/backend/review.test.ts
Task: T010 Add standard dashboard rendering and today review CTA coverage in tests/frontend/home.test.tsx
Task: T011 Add MVP home summary to review-start journey coverage in tests/e2e/home-screen.spec.ts
Task: T012 Implement summary aggregation and baseline state resolution in backend/src/repositories/homeRepository.ts
Task: T014 Implement dashboard summary cards and primary CTA layout in frontend/src/pages/Home.tsx, frontend/src/components/uniqueParts/HomeSummaryCard.tsx, and frontend/src/components/uniqueParts/HomePrimaryActions.tsx
```

### User Story 2

```bash
Task: T016 Add recent activity ordering and limit coverage in tests/backend/home.test.ts
Task: T017 Add primary-action routing and recent activity rendering coverage in tests/frontend/home.test.tsx
Task: T018 Add home navigation and recent activity journey coverage in tests/e2e/home-screen.spec.ts
Task: T019 Implement recent activity query, ordering, and label composition in backend/src/repositories/homeRepository.ts
Task: T020 Extend home response serialization for recent activities in backend/src/api/home.ts, backend/src/schemas/home.ts, and frontend/src/domain/home.ts
```

### User Story 3

```bash
Task: T022 Add first-use, no-review-today, empty-activity, and temporary-failure coverage in tests/backend/home.test.ts
Task: T023 Add first-use, no-review, retry, and keyboard-only action reachability coverage in tests/frontend/home.test.tsx
Task: T024 Add first-use, no-review, and fetch-failure journeys in tests/e2e/home-screen.spec.ts
Task: T025 Implement first-use and no-review-today state derivation plus temporary-failure mapping in backend/src/repositories/homeRepository.ts and backend/src/api/home.ts
Task: T026 Implement state-specific guidance panels and retry affordances in frontend/src/components/uniqueParts/HomeStatePanel.tsx and frontend/src/pages/Home.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して home feature のファイル配置とテスト受け皿を揃える
2. Phase 2 を完了して `/api/home`、DTO、client、画面分割の基盤を整える
3. Phase 3 を完了して 4 指標の summary と today review start を成立させる
4. User Story 1 を単独で検証してから次フェーズへ進む

### Incremental Delivery

1. User Story 2 で recent activities と主要導線の判断材料を追加する
2. User Story 3 で first-use、no-review、error の状態別案内を完成させる
3. 最後に Storybook、ドキュメント、アクセシビリティ、性能、lint、unit/integration、E2E を整える