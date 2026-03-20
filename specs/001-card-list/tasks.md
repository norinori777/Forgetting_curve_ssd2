# タスク: 学習カード一覧 (001-card-list)

**入力**: `specs/001-card-list/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`

**テスト**: この機能では `spec.md` の User Scenarios & Testing と `test.md` の最低要件に従い、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: ルーティング導入とトップレベルページの雛形を整え、後続ストーリーの作業面を揃える

- [X] T001 Add React Router dependency and bootstrap support in frontend/package.json and frontend/src/main.tsx
- [X] T002 [P] Create top-level placeholder page components in frontend/src/pages/Home.tsx, frontend/src/pages/Review.tsx, frontend/src/pages/Stats.tsx, and frontend/src/pages/Settings.tsx
- [X] T003 [P] Create top-level route metadata for navigation and breadcrumbs in frontend/src/utils/routes/topLevelPages.ts

**Checkpoint**: ルーティングに必要な依存関係とトップレベルページの配置先が揃う

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーに共通するレイアウト基盤と route-aware な画面切り替えを整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T004 Create shared fixed header, breadcrumb, and footer shell in frontend/src/components/uiParts/AppLayout.tsx
- [X] T005 Wire top-level routes and Outlet-based page switching in frontend/src/App.tsx and frontend/src/pages/CardList.tsx
- [X] T006 [P] Add route-aware smoke coverage for home and `/cards` navigation in tests/e2e/us1.spec.ts and tests/frontend/cardListStates.test.tsx

**Checkpoint**: 共通レイアウトと `/` / `/cards` / プレースホルダールートの切り替え基盤が揃う

---

## Phase 3: User Story 1 - 今日の復習から開始 (Priority: P1) 🎯 MVP

**Goal**: `/cards` の一覧から今日の復習対象を見つけ、そのまま現在の絞り込み結果で復習開始できるようにする

**Independent Test**: `/cards` でステータスを「今日の復習」に切り替え、「復習開始」を押すと、現在表示中のカード群で復習セッションが始まること

### Tests for User Story 1

- [X] T007 [P] [US1] Add current-filter review-start contract coverage in tests/backend/review.test.ts
- [X] T008 [P] [US1] Update route-aware today-review journey in tests/e2e/us1.spec.ts and tests/frontend/cardListStates.test.tsx

### Implementation for User Story 1

- [X] T009 [P] [US1] Align review request validation and filter fallback behavior in backend/src/api/review.ts and backend/src/schemas/review.ts
- [X] T010 [P] [US1] Update review call-to-action rendering in frontend/src/components/uiParts/StartReviewButton.tsx and frontend/src/components/uniqueParts/CardItem.tsx
- [X] T011 [US1] Route `/cards` list loading and current-filter review start flow in frontend/src/pages/CardList.tsx and frontend/src/services/api/reviewApi.ts

**Checkpoint**: User Story 1 を単独で実行し、一覧から復習開始までを確認できる

---

## Phase 4: User Story 2 - 検索/絞り込みで目的のカードを見つける (Priority: P2)

**Goal**: キーワード検索、単一選択ステータス、タグ/コレクション共用モーダル、一覧上部ソートで目的のカードを見つけられるようにする

**Independent Test**: キーワード検索、ステータス変更、共用モーダルでのタグまたはコレクション選択、一覧上部でのソート変更を個別に適用したときに一覧結果が期待通りに変化すること

### Tests for User Story 2

- [X] T012 [P] [US2] Add filter query and option endpoint coverage in tests/backend/cards.test.ts and tests/backend/filterOptions.test.ts
- [X] T013 [P] [US2] Update shared-modal, sort, and route-based filter journey in tests/e2e/us2.spec.ts
- [X] T014 [P] [US2] Add keyboard-only filter and async-state coverage in tests/frontend/cardListStates.test.tsx

### Implementation for User Story 2

- [X] T015 [P] [US2] Align list query parsing with single-select status and cursor reset rules in backend/src/schemas/cards.ts and backend/src/api/cards.ts
- [X] T016 [P] [US2] Implement shared tag and collection option lookups in backend/src/api/tags.ts, backend/src/api/collections.ts, backend/src/schemas/options.ts, and backend/src/repositories/cardRepository.ts
- [X] T017 [P] [US2] Replace separate filter controls with shared modal UI in frontend/src/components/uniqueParts/FilterSelectionModal.tsx, frontend/src/components/uniqueParts/FilterSelector.tsx, and frontend/src/components/uiParts/SearchBar.tsx
- [X] T018 [US2] Wire keyword, status, tag, collection, sort, loading, empty, error, and cursor-reset behavior in frontend/src/pages/CardList.tsx, frontend/src/services/api/cardListApi.ts, and frontend/src/services/api/filterOptionsApi.ts

**Checkpoint**: User Story 2 を単独で実行し、検索・絞り込み・ソートで目的カードを発見できる

---

## Phase 5: User Story 3 - 複数カードにまとめて操作する (Priority: P3)

**Goal**: 選択中カードに対してアーカイブ、削除、タグ追加/削除を安全に一括実行できるようにする

**Independent Test**: 複数選択後にアーカイブまたは削除を実行すると選択カードだけが更新され、削除は確認モーダルを経由し、タグ追加/削除は no-op を成功扱いにすること

### Tests for User Story 3

- [X] T019 [P] [US3] Add bulk archive and idempotent tag-mutation coverage in tests/backend/cards.test.ts
- [X] T020 [P] [US3] Update multi-select, archive, delete, and bulk-tag journeys in tests/e2e/us3.spec.ts and tests/frontend/deleteModal.test.tsx

### Implementation for User Story 3

- [X] T021 [P] [US3] Enforce bulk action validation and idempotent repository semantics in backend/src/schemas/bulk.ts, backend/src/api/bulk.ts, and backend/src/repositories/cardRepository.ts
- [X] T022 [P] [US3] Update selection and keyboard affordances in frontend/src/hooks/useSelection.ts and frontend/src/components/uiParts/SelectionBar.tsx
- [X] T023 [P] [US3] Update destructive-action and row-action UI in frontend/src/components/uniqueParts/DeleteConfirmModal.tsx and frontend/src/components/uniqueParts/CardItem.tsx
- [X] T024 [US3] Wire archive, delete, bulk-tag, and selection-clear flows in frontend/src/pages/CardList.tsx and frontend/src/services/api/bulkApi.ts

**Checkpoint**: User Story 3 を単独で実行し、複数選択とバルク操作を安全に完了できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント、Storybook、アクセシビリティ、性能、検証手順を最終整合する

- [X] T025 [P] Sync route and API documentation in specs/001-card-list/ascii_ui.txt, specs/001-card-list/quickstart.md, specs/001-card-list/contracts/openapi.yaml, backend/contracts/openapi.yaml, and docs/api/card-list.md
- [X] T026 [P] Refresh Storybook coverage in frontend/src/stories/CardItem.stories.tsx, frontend/src/stories/SearchBar.stories.tsx, frontend/src/stories/SelectionBar.stories.tsx, frontend/src/stories/StartReviewButton.stories.tsx, and frontend/src/stories/DeleteConfirmModal.stories.tsx
- [X] T027 [P] Update accessibility and performance checks in frontend/accessibility-audit.md and tests/perf/initialRender.test.tsx
- [X] T028 Run lint, unit/integration, and E2E validation via package.json, backend/package.json, frontend/package.json, tests/backend/cards.test.ts, tests/backend/review.test.ts, tests/backend/filterOptions.test.ts, tests/frontend/cardListStates.test.tsx, tests/frontend/deleteModal.test.tsx, tests/e2e/us1.spec.ts, tests/e2e/us2.spec.ts, and tests/e2e/us3.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。すぐ開始できる
- **Foundational (Phase 2)**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **User Story 1 (Phase 3)**: Phase 2 完了後に開始できる。MVP の最小範囲
- **User Story 2 (Phase 4)**: Phase 2 完了後に開始できる。US1 と独立に検証できる
- **User Story 3 (Phase 5)**: Phase 2 完了後に開始できる。bulk tag UI は US2 の共用モーダル整備後に統合しやすい
- **Polish (Phase 6)**: 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- **User Story 1 (P1)**: Foundational のみ依存。最短で価値を出せる MVP
- **User Story 2 (P2)**: Foundational のみ依存。検索・絞り込みの発見性改善を独立検証できる
- **User Story 3 (P3)**: Foundational のみ依存。ただし bulk tag 操作の UI 統合は US2 の共用モーダル実装後の方が進めやすい

### Within Each User Story

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- API / schema / repository の調整を先に行い、その後 UI 統合へ進む
- 1 ストーリーが独立して通る状態を作ってから次の優先度へ進む

---

## Parallel Examples

### User Story 1

```bash
Task: T007 Add current-filter review-start contract coverage in tests/backend/review.test.ts
Task: T008 Update route-aware today-review journey in tests/e2e/us1.spec.ts and tests/frontend/cardListStates.test.tsx
Task: T009 Align review request validation and filter fallback behavior in backend/src/api/review.ts and backend/src/schemas/review.ts
Task: T010 Update review call-to-action rendering in frontend/src/components/uiParts/StartReviewButton.tsx and frontend/src/components/uniqueParts/CardItem.tsx
```

### User Story 2

```bash
Task: T012 Add filter query and option endpoint coverage in tests/backend/cards.test.ts and tests/backend/filterOptions.test.ts
Task: T013 Update shared-modal, sort, and route-based filter journey in tests/e2e/us2.spec.ts
Task: T014 Add keyboard-only filter and async-state coverage in tests/frontend/cardListStates.test.tsx
Task: T015 Align list query parsing with single-select status and cursor reset rules in backend/src/schemas/cards.ts and backend/src/api/cards.ts
Task: T016 Implement shared tag and collection option lookups in backend/src/api/tags.ts, backend/src/api/collections.ts, backend/src/schemas/options.ts, and backend/src/repositories/cardRepository.ts
Task: T017 Replace separate filter controls with shared modal UI in frontend/src/components/uniqueParts/FilterSelectionModal.tsx, frontend/src/components/uniqueParts/FilterSelector.tsx, and frontend/src/components/uiParts/SearchBar.tsx
```

### User Story 3

```bash
Task: T019 Add bulk archive and idempotent tag-mutation coverage in tests/backend/cards.test.ts
Task: T020 Update multi-select, archive, delete, and bulk-tag journeys in tests/e2e/us3.spec.ts and tests/frontend/deleteModal.test.tsx
Task: T021 Enforce bulk action validation and idempotent repository semantics in backend/src/schemas/bulk.ts, backend/src/api/bulk.ts, and backend/src/repositories/cardRepository.ts
Task: T022 Update selection and keyboard affordances in frontend/src/hooks/useSelection.ts and frontend/src/components/uiParts/SelectionBar.tsx
Task: T023 Update destructive-action and row-action UI in frontend/src/components/uniqueParts/DeleteConfirmModal.tsx and frontend/src/components/uniqueParts/CardItem.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して React Router 依存とページ雛形を揃える
2. Phase 2 を完了して共通レイアウトと `/cards` 遷移基盤を整える
3. Phase 3 を完了して「今日の復習 → 復習開始」の最短導線を成立させる
4. User Story 1 を単独で検証してから次フェーズへ進む

### Incremental Delivery

1. User Story 2 で検索、ステータス、共用モーダル、一覧上部ソートを完成させる
2. User Story 3 で選択、削除確認、タグ追加/削除、アーカイブを完成させる
3. 最後に Storybook、ドキュメント、アクセシビリティ、性能、lint、テストをまとめて整える
