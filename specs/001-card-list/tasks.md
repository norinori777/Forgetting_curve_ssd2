# タスク: 学習カード一覧 (001-card-list)

**入力**: `specs/001-card-list/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`

**テスト**: この機能では仕様と憲法の両方で回帰防止が重要なため、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tailwind と共有型・クライアントの土台を整え、後続実装の前提を揃える

- [X] T001 Configure Tailwind and PostCSS bootstrap in frontend/package.json, frontend/postcss.config.js, and frontend/tailwind.config.ts
- [X] T002 [P] Wire Tailwind entry styles in frontend/src/index.css and frontend/src/main.tsx
- [X] T003 [P] Create theme token adapters in frontend/src/utils/theme/themeTokens.ts and frontend/src/utils/theme/tailwindTheme.ts
- [X] T004 [P] Create shared list DTO and API client scaffolding in backend/src/domain/cardList.ts, frontend/src/domain/cardList.ts, frontend/src/services/api/cardListApi.ts, frontend/src/services/api/reviewApi.ts, and frontend/src/services/api/bulkApi.ts

**Checkpoint**: Tailwind 基盤、トークン参照、共通 DTO / API クライアントの配置先が利用可能になる

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリーが依存する一覧契約、ページング、共通 UI 部品を整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T005 Move and register card, review, and bulk HTTP entrypoints in backend/src/api/cards.ts, backend/src/api/review.ts, backend/src/api/bulk.ts, and backend/src/index.ts
- [X] T006 [P] Update shared list and review schemas for single-select status filter and array ids in backend/src/schemas/cards.ts and backend/src/schemas/review.ts
- [X] T007 [P] Implement shared card filtering and cursor pagination logic in backend/src/repositories/cardRepository.ts and backend/src/services/searchService.ts
- [X] T008 [P] Create option lookup client and shared filter serializers in frontend/src/services/api/filterOptionsApi.ts, frontend/src/services/api/cardListApi.ts, frontend/src/services/api/reviewApi.ts, and frontend/src/services/api/bulkApi.ts
- [X] T009 [P] Align backend and frontend list filter types in backend/src/domain/cardList.ts and frontend/src/domain/cardList.ts
- [X] T010 [P] Build reusable modal and async-state primitives in frontend/src/components/uiParts/ModalShell.tsx, frontend/src/components/uiParts/OptionList.tsx, frontend/src/components/uiParts/AsyncState.tsx, and frontend/src/components/uiParts/RetryBanner.tsx
- [X] T011 Update backend regression coverage for shared list and review filter contracts in tests/backend/cards.test.ts and tests/backend/review.test.ts

**Checkpoint**: 共通 API 契約、カーソルページング、共有 UI プリミティブが揃い、各ユーザーストーリーを独立着手できる

---

## Phase 3: User Story 1 - 今日の復習から開始 (Priority: P1) 🎯 MVP

**Goal**: 今日の復習に該当するカードを一覧から見つけ、そのまま復習開始できるようにする

**Independent Test**: ステータスプルダウンで「今日の復習」を選択し、「復習開始」を押すと、現在表示中のカード群で復習セッションが始まること

### Tests for User Story 1

- [X] T012 [P] [US1] Add review-start filter propagation coverage in tests/backend/review.test.ts
- [X] T013 [P] [US1] Add today-review dropdown journey coverage in tests/e2e/us1.spec.ts and tests/frontend/cardListStates.test.tsx

### Implementation for User Story 1

- [X] T014 [P] [US1] Implement status dropdown and review CTA controls in frontend/src/components/uiParts/SearchBar.tsx and frontend/src/components/uiParts/StartReviewButton.tsx
- [X] T015 [P] [US1] Restyle review-first card rows in frontend/src/components/uniqueParts/CardItem.tsx and frontend/src/stories/CardItem.stories.tsx
- [X] T016 [US1] Wire today-review list loading, cursor reset, and review start flow in frontend/src/pages/CardList.tsx, frontend/src/services/api/cardListApi.ts, and frontend/src/services/api/reviewApi.ts

**Checkpoint**: User Story 1 は単独で動作し、一覧から復習開始までを確認できる

---

## Phase 4: User Story 2 - 検索/絞り込みで目的のカードを見つける (Priority: P2)

**Goal**: キーワード検索、ステータスプルダウン、タグ/コレクション共用モーダル、一覧上部ソートで目的のカードを見つけられるようにする

**Independent Test**: キーワード検索、ステータス変更、共用モーダルでのタグ選択、一覧上部でのソート変更を個別に適用したときに一覧結果が期待通りに変化すること

### Tests for User Story 2

- [X] T017 [P] [US2] Add option-endpoint contract coverage in tests/backend/filterOptions.test.ts
- [X] T018 [P] [US2] Add shared modal search and embedded-sort journey coverage in tests/e2e/us2.spec.ts
- [X] T019 [P] [US2] Add keyboard-only filter and async-state coverage in tests/e2e/us2.spec.ts and tests/frontend/cardListStates.test.tsx

### Implementation for User Story 2

- [X] T020 [P] [US2] Add option query validation and shared-modal route handlers in backend/src/schemas/options.ts, backend/src/api/tags.ts, backend/src/api/collections.ts, and backend/src/index.ts
- [X] T021 [US2] Implement tag and collection option lookup queries for the shared modal in backend/src/repositories/cardRepository.ts and backend/src/services/searchService.ts
- [X] T022 [P] [US2] Build shared filter modal with radio toggle in frontend/src/components/uniqueParts/FilterSelectionModal.tsx and frontend/src/components/uniqueParts/FilterSelector.tsx
- [X] T023 [P] [US2] Implement status dropdown and embedded sort UI in frontend/src/components/uiParts/SearchBar.tsx and frontend/src/stories/SearchBar.stories.tsx
- [X] T024 [US2] Wire keyword search, status dropdown, shared modal selections, selected summaries, loading/empty/error states, and cursor reset in frontend/src/pages/CardList.tsx, frontend/src/services/api/filterOptionsApi.ts, frontend/src/domain/cardList.ts, frontend/src/components/uiParts/AsyncState.tsx, and frontend/src/components/uiParts/RetryBanner.tsx

**Checkpoint**: User Story 2 は単独で動作し、共用モーダルと一覧上部ソートで目的カードを発見できる

---

## Phase 5: User Story 3 - 複数カードにまとめて操作する (Priority: P3)

**Goal**: 選択中カードに対してアーカイブ、削除、タグ追加/削除を安全に一括実行できるようにする

**Independent Test**: 複数選択後にアーカイブまたは削除を実行すると選択カードだけが更新され、削除は確認モーダルを経由すること

### Tests for User Story 3

- [X] T025 [P] [US3] Update bulk archive, delete, and bulk-tag journey coverage in tests/e2e/us3.spec.ts
- [X] T026 [P] [US3] Update delete confirmation and selection interaction coverage in tests/frontend/deleteModal.test.tsx and tests/frontend/cardListStates.test.tsx

### Implementation for User Story 3

- [X] T027 [P] [US3] Align bulk request validation and tag mutation handling in backend/src/schemas/bulk.ts, backend/src/api/bulk.ts, backend/src/repositories/cardRepository.ts, and backend/src/domain/cardList.ts
- [X] T028 [P] [US3] Expand keyboard-accessible selection controls and bulk affordances in frontend/src/components/uniqueParts/SelectionBar.tsx and frontend/src/hooks/useSelection.ts
- [X] T029 [P] [US3] Restyle irreversible delete confirmation and card action affordances in frontend/src/components/uniqueParts/DeleteConfirmModal.tsx and frontend/src/components/uniqueParts/CardItem.tsx
- [X] T030 [US3] Wire archive, delete, and bulk tag actions into frontend/src/pages/CardList.tsx, frontend/src/services/api/bulkApi.ts, frontend/src/components/uniqueParts/SelectionBar.tsx, and frontend/src/components/uniqueParts/CardItem.tsx

**Checkpoint**: User Story 3 は単独で動作し、複数選択とバルク操作を安全に完了できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 仕様、ドキュメント、検証、品質確認を最終整合する

- [X] T031 [P] Update Storybook coverage for shared filter, card item, selection bar, and delete modal in frontend/src/stories/SearchBar.stories.tsx, frontend/src/stories/CardItem.stories.tsx, frontend/src/stories/SelectionBar.stories.tsx, and frontend/src/stories/DeleteConfirmModal.stories.tsx
- [X] T032 [P] Sync API and screen documentation in backend/contracts/openapi.yaml, docs/api/card-list.md, specs/001-card-list/contracts/openapi.yaml, specs/001-card-list/quickstart.md, and specs/001-card-list/ascii_ui.txt
- [X] T033 [P] Refresh accessibility guidance and initial render baseline in frontend/accessibility-audit.md and tests/perf/initialRender.test.tsx
- [X] T034 Run unit and integration validation in package.json, vitest.config.ts, tests/backend/cards.test.ts, tests/backend/review.test.ts, tests/backend/filterOptions.test.ts, tests/frontend/cardListStates.test.tsx, and tests/frontend/deleteModal.test.tsx
- [X] T035 Run end-to-end validation in package.json, playwright.config.ts, tests/e2e/us1.spec.ts, tests/e2e/us2.spec.ts, and tests/e2e/us3.spec.ts
- [X] T036 Run build and lint validation in package.json, backend/package.json, frontend/package.json, backend/tsconfig.json, and frontend/tsconfig.json

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): 依存なし。すぐ開始できる
- Foundational (Phase 2): Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- User Story 1 (Phase 3): Phase 2 完了後に開始できる。MVP の最小範囲
- User Story 2 (Phase 4): Phase 2 完了後に開始できる。US1 と別担当でも進められる
- User Story 3 (Phase 5): Phase 2 完了後に開始できるが、US2 の共用モーダル基盤が揃うと bulk tag 操作との整合が取りやすい
- Polish (Phase 6): 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- User Story 1 (P1): Foundational のみ依存。最短で価値を出せる MVP
- User Story 2 (P2): Foundational のみ依存。検索・絞り込みの発見性改善を独立検証できる
- User Story 3 (P3): Foundational のみで着手可能。ただしタグ追加/削除 UI は US2 の共用モーダルと整合を取って進める

### Within Each User Story

- テストタスクを先に実装し、失敗を確認してから本実装へ進む
- バックエンド契約とデータ取得を先に揃え、その後 UI 統合を行う
- 1 ストーリーが独立して通る状態を作ってから次の優先度へ進む

---

## Parallel Examples

### User Story 1

```bash
Task: T012 Add review-start filter propagation coverage in tests/backend/review.test.ts
Task: T013 Add today-review dropdown journey coverage in tests/e2e/us1.spec.ts and tests/frontend/cardListStates.test.tsx
Task: T014 Implement status dropdown and review CTA controls in frontend/src/components/uiParts/SearchBar.tsx and frontend/src/components/uiParts/StartReviewButton.tsx
Task: T015 Restyle review-first card rows in frontend/src/components/uniqueParts/CardItem.tsx and frontend/src/stories/CardItem.stories.tsx
```

### User Story 2

```bash
Task: T017 Add option-endpoint contract coverage in tests/backend/filterOptions.test.ts
Task: T018 Add shared modal search and embedded-sort journey coverage in tests/e2e/us2.spec.ts
Task: T019 Add keyboard-only filter and async-state coverage in tests/e2e/us2.spec.ts and tests/frontend/cardListStates.test.tsx
Task: T020 Add option query validation and shared-modal route handlers in backend/src/schemas/options.ts, backend/src/api/tags.ts, backend/src/api/collections.ts, and backend/src/index.ts
Task: T022 Build shared filter modal with radio toggle in frontend/src/components/uniqueParts/FilterSelectionModal.tsx and frontend/src/components/uniqueParts/FilterSelector.tsx
Task: T023 Implement status dropdown and embedded sort UI in frontend/src/components/uiParts/SearchBar.tsx and frontend/src/stories/SearchBar.stories.tsx
```

### User Story 3

```bash
Task: T025 Update bulk archive, delete, and bulk-tag journey coverage in tests/e2e/us3.spec.ts
Task: T026 Update delete confirmation and selection interaction coverage in tests/frontend/deleteModal.test.tsx and tests/frontend/cardListStates.test.tsx
Task: T027 Align bulk request validation and tag mutation handling in backend/src/schemas/bulk.ts, backend/src/api/bulk.ts, backend/src/repositories/cardRepository.ts, and backend/src/domain/cardList.ts
Task: T028 Expand keyboard-accessible selection controls and bulk affordances in frontend/src/components/uniqueParts/SelectionBar.tsx and frontend/src/hooks/useSelection.ts
Task: T029 Restyle irreversible delete confirmation and card action affordances in frontend/src/components/uniqueParts/DeleteConfirmModal.tsx and frontend/src/components/uniqueParts/CardItem.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して Tailwind / トークン / 共通クライアントの基盤を整える
2. Phase 2 を完了して一覧契約、カーソルページング、共通 UI プリミティブを揃える
3. Phase 3 を完了して「今日の復習 → 復習開始」の最短導線を成立させる
4. User Story 1 を単独で検証してから次フェーズへ進む

### Incremental Delivery

1. User Story 2 で検索、ステータスプルダウン、共用モーダル、一覧上部ソートを完成させる
2. User Story 3 で選択、削除確認、バルク操作を完成させる
3. 最後に Storybook、ドキュメント、アクセシビリティ、性能、ビルド、lint、E2E をまとめて整える