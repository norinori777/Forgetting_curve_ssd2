# タスク: 学習カード一覧 (001-card-list)

**入力**: `specs/001-card-list/` 配下の設計ドキュメント
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`

**テスト**: この機能では仕様と憲法の両方で回帰防止が重要なため、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tailwind 基盤と新ディレクトリ構成の土台を整える

- [X] T001 Add Tailwind CSS and PostCSS devDependencies in frontend/package.json
- [X] T002 [P] Create theme-driven Tailwind configuration in frontend/tailwind.config.ts
- [X] T003 [P] Add Tailwind entry stylesheet wiring in frontend/src/index.css and frontend/src/main.tsx
- [X] T004 [P] Create target directories for the new structure in backend/src/api, backend/src/domain, backend/src/utils, frontend/src/components/uiParts, frontend/src/components/uniqueParts, frontend/src/services/api, frontend/src/domain, and frontend/src/utils/theme

**Checkpoint**: フロントエンドで `theme.json` を参照する Tailwind 基盤と新構造の配置先が利用可能になる

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーが共有する API 層、型、テーマ参照、データ取得基盤を整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T005 Move card, bulk, and review HTTP entrypoints into backend/src/api/cards.ts, backend/src/api/bulk.ts, and backend/src/api/review.ts, then update backend/src/index.ts imports and route registration to the new API layer
- [X] T006 [P] Update shared filter schemas for tagIds and collectionIds in backend/src/schemas/cards.ts and backend/src/schemas/review.ts
- [X] T007 [P] Extend array-based filter query logic in backend/src/services/searchService.ts and backend/src/repositories/cardRepository.ts
- [X] T008 [P] Create shared backend/frontend list filter and card DTO types in backend/src/domain/cardList.ts and frontend/src/domain/cardList.ts
- [X] T009 [P] Create typed API clients and filter serializers in frontend/src/services/api/cardListApi.ts, frontend/src/services/api/reviewApi.ts, and frontend/src/services/api/bulkApi.ts
- [X] T010 [P] Add theme token mapping helpers in frontend/src/utils/theme/themeTokens.ts and frontend/src/utils/theme/tailwindTheme.ts
- [X] T011 Update backend regression coverage for list and review filter contracts in tests/backend/cards.test.ts and tests/backend/review.test.ts

**Checkpoint**: API 層の再配置と `tagIds` / `collectionIds` ベースの共通契約、theme token 参照、API クライアントが揃う

---

## Phase 3: User Story 1 - 今日の復習から開始 (Priority: P1) 🎯 MVP

**Goal**: 今日の復習に該当するカードを Tailwind ベースの一覧 UI で確認し、そのまま復習開始できるようにする

**Independent Test**: 「今日の復習」を有効化し、「復習開始」を押すと、現在表示中のカード群で復習セッションが開始されること

### Tests for User Story 1

- [X] T012 [P] [US1] Add review-start filter propagation coverage in tests/backend/review.test.ts
- [X] T013 [P] [US1] Update today-review end-to-end scenario in tests/e2e/us1.spec.ts

### Implementation for User Story 1

- [X] T014 [P] [US1] Move and restyle review CTA and shared controls in frontend/src/components/uiParts/StartReviewButton.tsx and frontend/src/components/uiParts/SearchBar.tsx
- [X] T015 [P] [US1] Move and restyle today review controls and card row UI in frontend/src/components/uniqueParts/TodayFilter.tsx and frontend/src/components/uniqueParts/CardItem.tsx
- [X] T016 [US1] Rebuild the review-start list shell around frontend/src/pages/CardList.tsx using frontend/src/services/api/cardListApi.ts, frontend/src/services/api/reviewApi.ts, and frontend/src/domain/cardList.ts

**Checkpoint**: User Story 1 は単独で動作し、一覧から復習開始までを確認できる

---

## Phase 4: User Story 2 - 検索/絞り込みで目的のカードを見つける (Priority: P2)

**Goal**: キーワード検索、ソート、タグ/コレクションの検索付き複数選択モーダルで目的のカードを見つけられるようにする

**Independent Test**: キーワード検索、タグ選択、コレクション選択、ソート変更を個別に適用したときに一覧結果が期待通りに変化すること

### Tests for User Story 2

- [X] T017 [P] [US2] Update modal-based search and filter end-to-end coverage in tests/e2e/us2.spec.ts
- [ ] T018 [P] [US2] Add option-endpoint coverage for tag and collection queries in tests/backend/filterOptions.test.ts
- [ ] T019 [P] [US2] Add keyboard-only filter flow coverage in tests/e2e/us2.spec.ts
- [X] T020 [P] [US2] Add loading, empty, and error state coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/us2.spec.ts

### Implementation for User Story 2

- [X] T021 [P] [US2] Add option query validation schemas in backend/src/schemas/options.ts
- [X] T022 [P] [US2] Implement selectable tag and collection endpoints in backend/src/api/tags.ts and backend/src/api/collections.ts
- [X] T023 [US2] Extend tag and collection option lookup queries in backend/src/repositories/cardRepository.ts and backend/src/services/searchService.ts
- [X] T024 [US2] Register option routes from backend/src/api/tags.ts and backend/src/api/collections.ts in backend/src/index.ts
- [X] T025 [P] [US2] Create option lookup and filter label clients in frontend/src/services/api/filterOptionsApi.ts
- [X] T026 [P] [US2] Build reusable modal shell and searchable option list with focus management and keyboard navigation in frontend/src/components/uiParts/ModalShell.tsx and frontend/src/components/uiParts/OptionList.tsx
- [X] T027 [P] [US2] Create loading, empty, and error state UI in frontend/src/components/uiParts/AsyncState.tsx and frontend/src/components/uiParts/RetryBanner.tsx
- [X] T028 [P] [US2] Build searchable tag and collection multi-select panels in frontend/src/components/uniqueParts/TagFilterModal.tsx and frontend/src/components/uniqueParts/CollectionSelectorModal.tsx
- [X] T029 [US2] Replace selector inputs with button triggers and selected-label summaries in frontend/src/components/uniqueParts/TagFilter.tsx and frontend/src/components/uniqueParts/CollectionSelector.tsx
- [ ] T030 [US2] Wire modal filters, keyboard-only flows, loading/empty/error states, sort, selected summaries, and cursor reset in frontend/src/pages/CardList.tsx, frontend/src/components/uiParts/SearchBar.tsx, and frontend/src/domain/cardList.ts

**Checkpoint**: User Story 2 は単独で動作し、モーダル検索付きフィルタで目的カードを発見できる

---

## Phase 5: User Story 3 - 複数カードにまとめて操作する (Priority: P3)

**Goal**: 選択中カードに対してアーカイブ、削除、タグ追加/削除を安全に一括実行できるようにする

**Independent Test**: 複数選択後にアーカイブまたは削除を実行すると選択カードだけが更新され、削除は確認モーダルを経由すること

### Tests for User Story 3

- [ ] T031 [P] [US3] Update bulk archive and delete end-to-end coverage in tests/e2e/us3.spec.ts
- [ ] T032 [P] [US3] Update delete-confirm modal interaction coverage in tests/frontend/deleteModal.test.tsx

### Implementation for User Story 3

- [X] T033 [P] [US3] Align bulk request validation with tagIds payloads in backend/src/schemas/bulk.ts and backend/src/api/bulk.ts
- [ ] T034 [P] [US3] Update bulk tag mutation handling in backend/src/repositories/cardRepository.ts and backend/src/domain/cardList.ts
- [ ] T035 [P] [US3] Expand keyboard-accessible bulk actions in frontend/src/components/uniqueParts/SelectionBar.tsx and frontend/src/hooks/useSelection.ts
- [X] T036 [P] [US3] Update bulk action client payload handling in frontend/src/services/api/bulkApi.ts
- [X] T037 [US3] Restyle and expand selected-card confirmation details in frontend/src/components/uniqueParts/DeleteConfirmModal.tsx
- [ ] T038 [US3] Wire archive, delete, and bulk tag actions into frontend/src/pages/CardList.tsx, frontend/src/components/uniqueParts/CardItem.tsx, and frontend/src/components/uniqueParts/SelectionBar.tsx

**Checkpoint**: User Story 3 は単独で動作し、複数選択とバルク操作を安全に完了できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 仕様・ドキュメント・品質確認を最終整合する

- [ ] T039 [P] Update Storybook coverage for refactored uiParts and uniqueParts in frontend/src/stories/SearchBar.stories.tsx, frontend/src/stories/SelectionBar.stories.tsx, frontend/src/stories/DeleteConfirmModal.stories.tsx, frontend/src/stories/TagFilter.stories.tsx, and frontend/src/stories/CollectionSelector.stories.tsx
- [ ] T040 [P] Sync implemented API and screen documentation in backend/contracts/openapi.yaml, docs/api/card-list.md, and specs/001-card-list/quickstart.md
- [ ] T041 [P] Refresh accessibility guidance for the new modal and keyboard structure in frontend/accessibility-audit.md
- [ ] T042 [P] Rebaseline Tailwind initial-render regression in tests/perf/initialRender.test.tsx
- [ ] T043 Run unit and integration validation with `npm run test` using package.json, vitest.config.ts, tests/backend/cards.test.ts, tests/frontend/deleteModal.test.tsx, tests/frontend/cardListStates.test.tsx, and tests/perf/initialRender.test.tsx
- [ ] T044 Run end-to-end validation with `npm run test:e2e` using package.json, playwright.config.ts, tests/e2e/us1.spec.ts, tests/e2e/us2.spec.ts, and tests/e2e/us3.spec.ts
- [ ] T045 Run TypeScript compile validation with `npm --workspace backend run build` and `npm --workspace frontend run build` using backend/package.json, frontend/package.json, backend/tsconfig.json, and frontend/tsconfig.json
- [ ] T046 Run ESLint validation with `npm run lint` using package.json, frontend/package.json, and backend/package.json
- [ ] T047 [P] Add structured logging and PII non-output validation for API error and action flows in backend/src/api/cards.ts, backend/src/api/bulk.ts, backend/src/api/review.ts, backend/src/api/tags.ts, backend/src/api/collections.ts, and tests/backend/
- [ ] T048 [P] Update user-facing deletion and privacy guidance for irreversible delete flows in docs/ and specs/001-card-list/quickstart.md
- [ ] T049 [P] Define validation or operational measurement steps for SC-001, SC-003, and SC-004 in specs/001-card-list/quickstart.md and docs/api/card-list.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): 依存なし。すぐ開始できる
- Foundational (Phase 2): Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- User Story 1 (Phase 3): Phase 2 完了後に開始できる
- User Story 2 (Phase 4): Phase 2 完了後に開始できる
- User Story 3 (Phase 5): Phase 2 完了後に開始できるが、タグ追加/削除 UI で User Story 2 のモーダル基盤を再利用する場合は T026-T030 の完了後に統合すると安全
- Polish (Phase 6): 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- User Story 1 (P1): Foundational のみ依存。MVP の最小範囲
- User Story 2 (P2): Foundational のみ依存。US1 と別担当で並行実装可能
- User Story 3 (P3): Foundational のみで着手可能。ただし bulk tag action UI は US2 のモーダル部品を再利用すると実装量を減らせる

### Within Each User Story

- テストタスクを先に実装し、失敗を確認してから本実装に進む
- バックエンド契約・データ取得を先に揃え、その後 UI 統合を行う
- 1 ストーリーが独立して通る状態を作ってから次の優先度へ進む

---

## Parallel Examples

### User Story 1

```bash
Task: T012 Add review-start filter propagation coverage in tests/backend/review.test.ts
Task: T013 Update today-review end-to-end scenario in tests/e2e/us1.spec.ts

Task: T014 Move and restyle review CTA and shared controls in frontend/src/components/uiParts/StartReviewButton.tsx and frontend/src/components/uiParts/SearchBar.tsx
Task: T015 Move and restyle today review controls and card row UI in frontend/src/components/uniqueParts/TodayFilter.tsx and frontend/src/components/uniqueParts/CardItem.tsx
```

### User Story 2

```bash
Task: T017 Update modal-based search and filter end-to-end coverage in tests/e2e/us2.spec.ts
Task: T019 Add keyboard-only filter flow coverage in tests/e2e/us2.spec.ts

Task: T021 Add option query validation schemas in backend/src/schemas/options.ts
Task: T025 Create option lookup and filter label clients in frontend/src/services/api/filterOptionsApi.ts
Task: T026 Build reusable modal shell and searchable option list with focus management and keyboard navigation in frontend/src/components/uiParts/ModalShell.tsx and frontend/src/components/uiParts/OptionList.tsx
Task: T028 Build searchable tag and collection multi-select panels in frontend/src/components/uniqueParts/TagFilterModal.tsx and frontend/src/components/uniqueParts/CollectionSelectorModal.tsx
```

### User Story 3

```bash
Task: T031 Update bulk archive and delete end-to-end coverage in tests/e2e/us3.spec.ts
Task: T032 Update delete-confirm modal interaction coverage in tests/frontend/deleteModal.test.tsx

Task: T033 Align bulk request validation with tagIds payloads in backend/src/schemas/bulk.ts and backend/src/api/bulk.ts
Task: T035 Expand keyboard-accessible bulk actions in frontend/src/components/uniqueParts/SelectionBar.tsx and frontend/src/hooks/useSelection.ts
Task: T036 Update bulk action client payload handling in frontend/src/services/api/bulkApi.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して Tailwind 基盤を導入する
2. Phase 2 を完了して `tagIds` / `collectionIds` ベースの共通フィルタ契約と新ディレクトリ構造を揃える
3. Phase 3 を完了して「今日の復習 → 復習開始」の最短導線を新構造上で成立させる
4. User Story 1 を単独で検証してから次フェーズへ進む

### Incremental Delivery

1. User Story 2 で検索・絞り込み体験を完成させる
2. User Story 3 でバルク操作と削除確認を完成させる
3. 最後に Storybook、ドキュメント、アクセシビリティ、性能確認、構造化ログ、成功基準の検証手順、TypeScript / ESLint の静的検証をまとめて整える
