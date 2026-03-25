# タスク: Search Results Review Start

**入力**: `specs/002-review-search-results/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`

**テスト**: この機能では `spec.md` の User Scenarios & Testing、`quickstart.md`、`test.md`、憲法の DoD に従い、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 検索結果起点の review start を実装するための型とテスト受け皿を揃える

- [X] T001 Align search-result review start and target-resolution notice type touchpoints in backend/src/domain/cardList.ts, backend/src/domain/review.ts, frontend/src/domain/cardList.ts, and frontend/src/domain/review.ts
- [X] T002 [P] Prepare search-driven review, over-limit, and performance test fixtures in tests/backend/review.test.ts, tests/frontend/cardListStates.test.tsx, tests/frontend/review.test.tsx, tests/e2e/review-screen.spec.ts, and tests/perf/

**Checkpoint**: 影響範囲の型とテスト受け皿が揃い、共通実装に着手できる

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーに共通する search-result target 解決と review start 契約を整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T003 Implement an ordered review-target resolver with 200-card cap and exclusion breakdown generation for current CardListFilter in backend/src/repositories/cardRepository.ts and backend/src/services/searchService.ts
- [X] T004 [P] Update review-start validation and contract semantics for capped target sets and targetResolution metadata in backend/src/schemas/review.ts, backend/src/api/review.ts, backend/contracts/openapi.yaml, and specs/002-review-search-results/contracts/openapi.yaml
- [X] T005 [P] Align frontend review-start request, targetResolution typing, and stored session typing in frontend/src/services/api/reviewApi.ts, frontend/src/utils/reviewSessionStorage.ts, and frontend/src/domain/review.ts

**Checkpoint**: 検索条件から ordered target set を解決する基盤と review start 契約が揃う

---

## Phase 3: User Story 1 - 検索結果から復習を始める (Priority: P1) 🎯 MVP

**Goal**: 一覧の現在検索結果から、その結果集合を対象に review session を開始できるようにする

**Independent Test**: カード一覧で検索条件を設定し、その状態で「復習開始」を押すと、最新の検索結果に一致するカード群で review session が開始されること

### Tests for User Story 1

- [X] T006 [P] [US1] Add backend coverage for latest CardListFilter to capped ordered review target resolution in tests/backend/review.test.ts
- [X] T007 [P] [US1] Add card-list search-result start and 200-card cap coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/review-screen.spec.ts

### Implementation for User Story 1

- [X] T008 [P] [US1] Implement filter-driven review session creation with capped targetResolution metadata in backend/src/api/review.ts and backend/src/repositories/reviewSessionRepository.ts
- [X] T009 [P] [US1] Wire the latest search-state review start flow and cap-aware start result handling in frontend/src/pages/CardList.tsx and frontend/src/services/api/reviewApi.ts
- [X] T010 [US1] Ensure review start navigation and stored filter recovery stay aligned with targetResolution metadata in frontend/src/pages/CardList.tsx, frontend/src/pages/Review.tsx, and frontend/src/utils/routes/reviewSession.ts

**Checkpoint**: User Story 1 を単独で実行し、検索結果から復習開始までを確認できる

---

## Phase 4: User Story 2 - 検索結果のカードを順番に復習する (Priority: P1)

**Goal**: 開始時点の検索結果集合だけを Review 画面で 1 枚ずつ順番に復習できるようにする

**Independent Test**: 検索結果 2 件以上の状態から review を開始し、Review 画面で対象カードだけが順番どおりに表示され、対象外カードが混ざらないこと

### Tests for User Story 2

- [X] T011 [P] [US2] Add backend coverage that capped review sessions preserve ordered search-result cards only in tests/backend/review.test.ts
- [X] T012 [P] [US2] Add search-started review progression and exclusion notice persistence coverage in tests/frontend/review.test.tsx and tests/e2e/review-screen.spec.ts

### Implementation for User Story 2

- [X] T013 [P] [US2] Persist ordered capped search-result target sets and snapshot targetResolution summaries in backend/src/repositories/reviewSessionRepository.ts and backend/src/domain/review.ts
- [X] T014 [US2] Ensure Review page consumes only session-backed search-result cards and displays targetResolution notices in frontend/src/pages/Review.tsx, frontend/src/domain/review.ts, and frontend/src/components/uiParts/ReviewProgressHeader.tsx

**Checkpoint**: User Story 2 を単独で実行し、検索結果のカード群だけを順番に復習できる

---

## Phase 5: User Story 3 - 対象がないときに誤開始しない (Priority: P2)

**Goal**: 検索結果が空、開始直前に対象が失われたとき、または上限超過で一部が除外されるときに、安全に開始結果と次の行動を案内できるようにする

**Independent Test**: 検索結果 0 件の状態、開始直前に対象が消える状態、または 200 件超で開始する状態で review start を試みたとき、空の Review 画面に進まず、必要な除外理由や条件見直し導線が表示されること

### Tests for User Story 3

- [X] T015 [P] [US3] Add no-match, unavailable-target, and over-limit review-start coverage in tests/backend/review.test.ts
- [X] T016 [P] [US3] Add empty-result, exclusion-reason, and retry-guidance coverage in tests/frontend/review.test.tsx and tests/e2e/review-screen.spec.ts

### Implementation for User Story 3

- [X] T017 [P] [US3] Implement empty-target, unavailable-target, and over-limit exclusion handling in backend/src/api/review.ts and backend/src/repositories/cardRepository.ts
- [X] T018 [US3] Present empty-result retry, exclusion reason, and list-return flows in frontend/src/pages/CardList.tsx and frontend/src/pages/Review.tsx

**Checkpoint**: User Story 3 を単独で実行し、対象なしの開始失敗を安全に扱える

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメントと総合検証を最終整合する

- [X] T019 [P] Sync final review-start documentation in specs/002-review-search-results/quickstart.md, specs/002-review-search-results/contracts/openapi.yaml, and backend/contracts/openapi.yaml
- [X] T020 [P] Add review-start performance verification coverage for p95 start latency and review navigation responsiveness in tests/perf/ and test.md
- [X] T021 Run lint, unit/integration, performance, and E2E validation via package.json, tests/backend/review.test.ts, tests/frontend/cardListStates.test.tsx, tests/frontend/review.test.tsx, tests/e2e/review-screen.spec.ts, and tests/perf/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。すぐ開始できる
- **Foundational (Phase 2)**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **User Story 1 (Phase 3)**: Phase 2 完了後に開始できる。MVP の最小範囲
- **User Story 2 (Phase 4)**: Phase 2 完了後に開始できる。US1 の開始フローを再利用しても、session 内の対象カード整合性という観点で独立検証できる
- **User Story 3 (Phase 5)**: Phase 2 完了後に開始できる。空結果、開始失敗処理、上限超過時の説明責務の観点で独立検証できる
- **Polish (Phase 6)**: 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- **User Story 1 (P1)**: Foundational のみ依存。検索結果から復習開始する MVP
- **User Story 2 (P1)**: Foundational のみ依存。開始済み session の中身が検索結果と一致することを独立検証できる
- **User Story 3 (P2)**: Foundational のみ依存。空結果、unavailable target、over-limit exclusion の安全な開始導線を独立検証できる

### Within Each User Story

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- backend の resolver / API / session 永続化を先に整え、その後 frontend の統合へ進む
- 1 ストーリーが単独で通る状態を作ってから次の優先度へ進む

### Parallel Opportunities

- Setup の T002 は T001 と並列に進められる
- Foundational の T004 と T005 は T003 の責務定義後に並列に進められる
- 各ストーリーの backend test と frontend/E2E test は並列に進められる
- US1 完了後、US2 と US3 は並列着手できる
- Polish の T019 と T020 は各ストーリー完了後に並列で進められる

---

## Parallel Example: User Story 1

```bash
Task: T006 Add backend coverage for latest CardListFilter to ordered review target resolution in tests/backend/review.test.ts
Task: T007 Add card-list search-result start and 200-card cap coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/review-screen.spec.ts
Task: T008 Implement filter-driven review session creation with capped targetResolution metadata in backend/src/api/review.ts and backend/src/repositories/reviewSessionRepository.ts
Task: T009 Wire the latest search-state review start flow and cap-aware start result handling in frontend/src/pages/CardList.tsx and frontend/src/services/api/reviewApi.ts
```

## Parallel Example: User Story 2

```bash
Task: T011 Add backend coverage that capped review sessions preserve ordered search-result cards only in tests/backend/review.test.ts
Task: T012 Add search-started review progression and exclusion notice persistence coverage in tests/frontend/review.test.tsx and tests/e2e/review-screen.spec.ts
Task: T013 Persist ordered capped search-result target sets and snapshot targetResolution summaries in backend/src/repositories/reviewSessionRepository.ts and backend/src/domain/review.ts
```

## Parallel Example: User Story 3

```bash
Task: T015 Add no-match, unavailable-target, and over-limit review-start coverage in tests/backend/review.test.ts
Task: T016 Add empty-result, exclusion-reason, and retry-guidance coverage in tests/frontend/review.test.tsx and tests/e2e/review-screen.spec.ts
Task: T017 Implement empty-target, unavailable-target, and over-limit exclusion handling in backend/src/api/review.ts and backend/src/repositories/cardRepository.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して型とテスト受け皿を揃える
2. Phase 2 を完了して検索条件から capped ordered target set を解決する基盤を整える
3. Phase 3 を完了して「検索結果から復習開始」の最短導線を成立させる
4. User Story 1 を単独で検証してから次フェーズへ進む

### Incremental Delivery

1. User Story 2 で Review 画面の対象カード整合性と順序保証を完成させる
2. User Story 3 で空結果、unavailable target、over-limit exclusion の開始導線を完成させる
3. 最後に OpenAPI、quickstart、backend 契約、性能確認、lint、unit/integration、E2E をまとめて整える
