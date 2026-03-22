# タスク: カード回答項目 (001-card-answer-field)

**入力**: `specs/001-card-answer-field/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`、`contracts/preferences.md`

**テスト**: この機能では `spec.md` の User Scenarios & Testing と `test.md` の最低要件に従い、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 回答項目を受け入れるための共有スキーマと型の土台を先に整える

- [X] T001 Update the optional answer field on the shared card schema in prisma/schema.prisma
- [X] T002 [P] Extend shared card DTOs for answer payloads in backend/src/domain/cardList.ts and frontend/src/domain/cardList.ts
- [X] T003 [P] Create a read-only answer display preference helper in frontend/src/services/answerDisplayPreference.ts

**Checkpoint**: answer を扱うための schema、型、設定参照口が揃う

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 全ユーザーストーリーが依存する API 契約、検索基盤、migration、共通テスト土台を整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T004 Update answer-aware list response mapping and API contract in backend/src/repositories/cardRepository.ts and backend/contracts/openapi.yaml
- [X] T005 [P] Expand shared list-search filtering to include answer text in backend/src/services/searchService.ts and backend/src/schemas/cards.ts
- [X] T006 [P] Seed answer-capable fixtures and story data in tests/backend/cards.test.ts, tests/frontend/cardListStates.test.tsx, and frontend/src/stories/CardItem.stories.tsx
- [X] T007 Generate and check in the Prisma migration for the answer field under prisma/migrations/ and validate prisma generation from prisma/schema.prisma

**Checkpoint**: backend 契約、検索基盤、migration、共通 fixture が揃い、各ストーリーを並行実装できる

---

## Phase 3: User Story 1 - 一覧で必要なときだけ回答を見る (Priority: P1) 🎯 MVP

**Goal**: 回答ありカードで必要なときだけ回答を表示し、カード単位で独立して確認できるようにする

**Independent Test**: 回答ありカードが表示されている一覧で「回答を表示」を押すと、そのカードだけリンクが回答本文に置き換わり、他カードは変化しないこと

### Tests for User Story 1

- [X] T008 [P] [US1] Add API coverage for answer-present and answer-null cards in tests/backend/cards.test.ts
- [X] T009 [P] [US1] Add per-card answer toggle coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/answer-display.spec.ts

### Implementation for User Story 1

- [X] T010 [P] [US1] Return answer values from the list API in backend/src/repositories/cardRepository.ts and backend/src/api/cards.ts
- [X] T011 [P] [US1] Render answer link, answer body, and unanswered state in frontend/src/components/uniqueParts/CardItem.tsx
- [X] T012 [US1] Manage card-scoped answer visibility state in frontend/src/pages/CardList.tsx

**Checkpoint**: User Story 1 を単独で実行し、一覧から必要なカードだけ回答を見られる

---

## Phase 4: User Story 2 - 回答がなくてもカードを使い続ける (Priority: P1)

**Goal**: 回答なしカードを既存カードと同様に扱いながら、回答内一致でも一覧検索できるようにする

**Independent Test**: 回答あり/なしカードが混在する一覧で、未回答カードが通常表示され、回答にしか含まれない検索語でも対象カードが結果に出ること

### Tests for User Story 2

- [X] T013 [P] [US2] Add answer-search and null-answer filtering coverage in tests/backend/cards.test.ts
- [X] T014 [P] [US2] Add unanswered-card and answer-search UI coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/answer-search.spec.ts

### Implementation for User Story 2

- [X] T015 [P] [US2] Extend list search logic to match answer text in backend/src/services/searchService.ts
- [X] T016 [P] [US2] Propagate answer-aware list types and API parsing in frontend/src/domain/cardList.ts and frontend/src/services/api/cardListApi.ts
- [X] T017 [US2] Surface unanswered labels and answer-search results in frontend/src/pages/CardList.tsx and frontend/src/components/uniqueParts/CardItem.tsx

**Checkpoint**: User Story 2 を単独で実行し、回答なしカードの継続利用と回答内検索を確認できる

---

## Phase 5: User Story 3 - 設定値に応じた既定表示で学習する (Priority: P2)

**Goal**: 回答表示モードの設定値に応じて link / inline を切り替え、未設定や不正値でも安全な既定表示を適用する

**Independent Test**: `fc.cardList.answerDisplayMode` を `link`、`inline`、未設定/不正値に切り替えたとき、一覧初期表示がそれぞれ正しく変わること

### Tests for User Story 3

- [X] T018 [P] [US3] Add preference parsing and fallback coverage in tests/frontend/answerDisplayPreference.test.ts
- [X] T019 [P] [US3] Add default-mode rendering coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/answer-display-mode.spec.ts

### Implementation for User Story 3

- [X] T020 [P] [US3] Implement local answer display preference parsing and normalization in frontend/src/services/answerDisplayPreference.ts
- [X] T021 [P] [US3] Apply inline answer clamping and fallback mode rendering in frontend/src/components/uniqueParts/CardItem.tsx
- [X] T022 [US3] Reinitialize answer visibility from preference reads on list load and refetch in frontend/src/pages/CardList.tsx

**Checkpoint**: User Story 3 を単独で実行し、設定値に応じた既定表示と安全なフォールバックを確認できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント、Storybook、検証手順、全体回帰を最終整合する

- [X] T023 [P] Sync answer-display documentation in specs/001-card-answer-field/ascii_ui.txt, specs/001-card-answer-field/quickstart.md, and specs/001-card-answer-field/contracts/preferences.md
- [X] T024 [P] Refresh Storybook answer scenarios in frontend/src/stories/CardItem.stories.tsx
- [X] T025 Run lint, unit/integration, and E2E validation via package.json, backend/package.json, frontend/package.json, tests/backend/cards.test.ts, tests/frontend/cardListStates.test.tsx, tests/frontend/answerDisplayPreference.test.ts, tests/e2e/answer-display.spec.ts, tests/e2e/answer-search.spec.ts, and tests/e2e/answer-display-mode.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。すぐ開始できる
- **Foundational (Phase 2)**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **User Story 1 (Phase 3)**: Phase 2 完了後に開始できる。最小の MVP
- **User Story 2 (Phase 4)**: Phase 2 完了後に開始できる。US1 と独立に検証できる
- **User Story 3 (Phase 5)**: Phase 2 完了後に開始できる。US1/US2 と独立に検証できる
- **Polish (Phase 6)**: 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- **User Story 1 (P1)**: Foundational のみ依存。回答表示の最小価値を提供する MVP
- **User Story 2 (P1)**: Foundational のみ依存。回答なしカードの継続利用と回答内検索を独立検証できる
- **User Story 3 (P2)**: Foundational のみ依存。回答表示モードの切替とフォールバックを独立検証できる

### Within Each User Story

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- backend の検索/契約/型を先に固め、その後 frontend 表示統合へ進む
- 1 ストーリーが独立して通る状態を作ってから次の優先順位へ進む

---

## Parallel Examples

### User Story 1

```bash
Task: T008 Add API coverage for answer-present and answer-null cards in tests/backend/cards.test.ts
Task: T009 Add per-card answer toggle coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/answer-display.spec.ts
Task: T010 Return answer values from the list API in backend/src/repositories/cardRepository.ts and backend/src/api/cards.ts
Task: T011 Render answer link, answer body, and unanswered state in frontend/src/components/uniqueParts/CardItem.tsx
```

### User Story 2

```bash
Task: T013 Add answer-search and null-answer filtering coverage in tests/backend/cards.test.ts
Task: T014 Add unanswered-card and answer-search UI coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/answer-search.spec.ts
Task: T015 Extend list search logic to match answer text in backend/src/services/searchService.ts
Task: T016 Propagate answer-aware list types and API parsing in frontend/src/domain/cardList.ts and frontend/src/services/api/cardListApi.ts
```

### User Story 3

```bash
Task: T018 Add preference parsing and fallback coverage in tests/frontend/answerDisplayPreference.test.ts
Task: T019 Add default-mode rendering coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/answer-display-mode.spec.ts
Task: T020 Implement local answer display preference parsing and normalization in frontend/src/services/answerDisplayPreference.ts
Task: T021 Apply inline answer clamping and fallback mode rendering in frontend/src/components/uniqueParts/CardItem.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して answer を扱う schema、型、設定参照口を揃える
2. Phase 2 を完了して answer を返す API 契約、検索基盤、migration、fixtures を整える
3. Phase 3 を完了して「一覧で必要なときだけ回答を見る」を成立させる
4. User Story 1 を単独で検証してから次フェーズへ進む

### Incremental Delivery

1. User Story 2 で回答なしカードの継続利用と回答内検索を完成させる
2. User Story 3 で表示設定に基づく既定表示とフォールバックを完成させる
3. 最後に docs、Storybook、lint、unit/integration、E2E をまとめて整える