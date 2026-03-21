# タスク: 学習カード登録画面 (001-study-card-create)

**入力**: `specs/001-study-card-create/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`

**テスト**: この機能では `spec.md` の User Scenarios & Testing、`plan.md` の Test strategy、`test.md` の最低要件に従い、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 学習カード登録画面のページ、型、部品の置き場所を整え、後続ストーリーの実装面を揃える

- [X] T001 Wire `/cards/create` page shell and route registration in frontend/src/App.tsx and frontend/src/pages/CardCreate.tsx
- [X] T002 [P] Create card-create domain and API client scaffolds in frontend/src/domain/cardCreate.ts and frontend/src/services/api/cardCreateApi.ts
- [X] T003 [P] Create card-create UI component shells in frontend/src/components/uniqueParts/CardCreateForm.tsx and frontend/src/components/uniqueParts/CardCreatePreview.tsx

**Checkpoint**: 登録画面のルート、型、UI 部品の基本配置が揃う

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーに共通する API 契約、永続化、パンくず/成功通知基盤を整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T004 Define create-card message catalog keys and flash message shape in docs/messages.md, frontend/src/domain/cardCreate.ts, and frontend/src/domain/cardList.ts
- [X] T005 [P] Add POST `/api/cards` contract and create-card schema definitions in backend/src/schemas/cards.ts and backend/contracts/openapi.yaml
- [X] T006 [P] Add transactional create-card repository primitives in backend/src/repositories/cardRepository.ts
- [X] T006a Add structured logging and PII-safe error logging for POST /api/cards in backend/src/api/cards.ts and backend/src/repositories/cardRepository.ts
- [X] T007 Add `/cards/create` breadcrumb resolution and cards-list success flash baseline in frontend/src/utils/routes/topLevelPages.ts and frontend/src/pages/CardList.tsx
- [X] T007a Add create-draft persistence and retry-safe submit state in frontend/src/domain/cardCreate.ts and frontend/src/pages/CardCreate.tsx

**Checkpoint**: 契約、永続化、メッセージ、ルーティング基盤が揃い、各ストーリーの実装に着手できる

---

## Phase 3: User Story 1 - 学習カードを新規登録する (Priority: P1) 🎯 MVP

**Goal**: 登録画面でタイトル、学習内容、タグ、コレクションを入力し、新しい学習カードを保存してカード一覧へ戻れるようにする

**Independent Test**: `/cards/create` を直接開き、タイトルと学習内容を入力して登録するとカードが保存され、カード一覧へ戻って成功メッセージが表示されること

### Tests for User Story 1

- [X] T008 [P] [US1] Add POST `/api/cards` contract and validation coverage in tests/backend/cards.test.ts
- [X] T009 [P] [US1] Add create-card submit and validation coverage in tests/frontend/cardCreate.test.tsx
- [X] T010 [P] [US1] Add create-card happy-path journey coverage in tests/e2e/cardCreate.spec.ts

### Implementation for User Story 1

- [X] T011 [US1] Implement POST `/api/cards` request parsing and error responses in backend/src/api/cards.ts and backend/src/schemas/cards.ts
- [X] T012 [US1] Implement transactional card, tag, and collection persistence in backend/src/repositories/cardRepository.ts
- [X] T013 [US1] Implement create-card submit flow and redirect handling in frontend/src/services/api/cardCreateApi.ts and frontend/src/pages/CardCreate.tsx
- [X] T013a [US1] Implement explicit retry flow with preserved input after network failure in frontend/src/services/api/cardCreateApi.ts and frontend/src/pages/CardCreate.tsx
- [X] T014 [P] [US1] Build required title/content/tag/collection fields and submit/error UI in frontend/src/components/uniqueParts/CardCreateForm.tsx and frontend/src/pages/CardCreate.tsx
- [X] T015 [US1] Show create success flash on cards list in frontend/src/pages/CardList.tsx and docs/messages.md

**Checkpoint**: User Story 1 を単独で実行し、登録画面から新規カード保存と一覧復帰までを確認できる

---

## Phase 4: User Story 2 - 一覧やヘッダーから登録画面へ移動する (Priority: P2)

**Goal**: ヘッダーメニューとカード一覧右上の両方から、学習カード登録画面へ迷わず遷移できるようにする

**Independent Test**: 任意のトップレベルページからヘッダーメニューの「学習カード登録」で登録画面へ遷移でき、`/cards` では右上の「新規カード」からも同じ画面へ到達し、「一覧へ戻る」でカード一覧へ戻れること

### Tests for User Story 2

- [X] T016 [P] [US2] Add header and list-entry navigation coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/cardCreate.spec.ts

### Implementation for User Story 2

- [X] T017 [P] [US2] Add top-level navigation item and active-state handling in frontend/src/components/uiParts/AppLayout.tsx and frontend/src/utils/routes/topLevelPages.ts
- [X] T018 [US2] Add cards-list create CTA and return-link wiring in frontend/src/pages/CardList.tsx and frontend/src/pages/CardCreate.tsx

**Checkpoint**: User Story 2 を単独で実行し、ヘッダーと一覧から登録画面への導線を確認できる

---

## Phase 5: User Story 3 - 入力内容を確認して調整する (Priority: P3)

**Goal**: 登録前にプレビューで内容を見直し、入力リセットや未保存注意を使って内容を調整できるようにする

**Independent Test**: `/cards/create` でタイトル、学習内容、タグ、コレクションを入力するとプレビューに反映され、「入力をリセット」で初期状態へ戻り、未保存のまま離脱しようとすると注意メッセージを認識できること

### Tests for User Story 3

- [X] T019 [P] [US3] Add preview, reset, and unsaved-changes coverage in tests/frontend/cardCreate.test.tsx
- [X] T019a [P] [US3] Add collection-create absence coverage in tests/frontend/cardCreate.test.tsx
- [X] T020 [P] [US3] Add preview and reset journey coverage in tests/e2e/cardCreate.spec.ts
- [X] T020a [P] [US3] Add network-failure retry journey coverage in tests/e2e/cardCreate.spec.ts

### Implementation for User Story 3

- [X] T021 [P] [US3] Implement draft parsing, tag normalization, and field-level validation state in frontend/src/domain/cardCreate.ts and frontend/src/pages/CardCreate.tsx
- [X] T022 [P] [US3] Implement preview and reset UI in frontend/src/components/uniqueParts/CardCreatePreview.tsx and frontend/src/components/uniqueParts/CardCreateForm.tsx
- [X] T023 [US3] Implement single-select collection picker and unsaved-changes messaging in frontend/src/components/uniqueParts/CollectionSelector.tsx, frontend/src/components/uniqueParts/CollectionSelectorModal.tsx, frontend/src/services/api/filterOptionsApi.ts, and frontend/src/pages/CardCreate.tsx

**Checkpoint**: User Story 3 を単独で実行し、入力確認・リセット・未保存注意を確認できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: API 文書、Storybook、品質チェック、検証手順を最終整合する

- [X] T024 [P] Sync create-card documentation in specs/001-study-card-create/quickstart.md, specs/001-study-card-create/contracts/openapi.yaml, backend/contracts/openapi.yaml, docs/api/card-list.md, and docs/messages.md
- [X] T025 [P] Add Storybook coverage for create-card UI in frontend/src/stories/CardCreateForm.stories.tsx and frontend/src/stories/CardCreatePreview.stories.tsx
- [X] T026 [P] Update accessibility, mobile layout order, and performance checks for the create page in frontend/accessibility-audit.md, tests/perf/initialRender.test.tsx, tests/frontend/cardCreate.test.tsx, and tests/frontend/cardListStates.test.tsx
- [X] T026a [P] Validate structured logging and no-PII error handling for create-card failures in backend/src/api/cards.ts and tests/backend/cards.test.ts
- [X] T027 Run lint, unit/integration, and E2E validation via package.json, backend/package.json, frontend/package.json, tests/backend/cards.test.ts, tests/frontend/cardCreate.test.tsx, tests/frontend/cardListStates.test.tsx, and tests/e2e/cardCreate.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。すぐ開始できる
- **Foundational (Phase 2)**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **User Story 1 (Phase 3)**: Phase 2 完了後に開始できる。MVP の最小価値
- **User Story 2 (Phase 4)**: Phase 2 完了後に開始できる。登録画面への導線を独立検証できる
- **User Story 3 (Phase 5)**: Phase 2 完了後に開始できる。入力調整体験を独立検証できる
- **Polish (Phase 6)**: 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- **User Story 1 (P1)**: Foundational のみ依存。MVP として先に実装・検証する
- **User Story 2 (P2)**: Foundational のみ依存。登録 API が未完成でも、登録画面シェルへの導線は独立検証できる
- **User Story 3 (P3)**: Foundational のみ依存。US1 の保存処理と統合すると完成度が上がるが、プレビュー/リセット/注意喚起自体は独立実装可能

### Within Each User Story

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- backend の schema / repository / api を先に整え、その後 frontend の送信統合へ進む
- UI 部品とページ統合を分け、1 ストーリーが独立して通る状態を作ってから次の優先度へ進む

---

## Parallel Examples

### User Story 1

```bash
Task: T008 Add POST `/api/cards` contract and validation coverage in tests/backend/cards.test.ts
Task: T009 Add create-card submit and validation coverage in tests/frontend/cardCreate.test.tsx
Task: T010 Add create-card happy-path journey coverage in tests/e2e/cardCreate.spec.ts
Task: T014 Build required title/content/tag/collection fields and submit/error UI in frontend/src/components/uniqueParts/CardCreateForm.tsx and frontend/src/pages/CardCreate.tsx
```

### User Story 2

```bash
Task: T016 Add header and list-entry navigation coverage in tests/frontend/cardListStates.test.tsx and tests/e2e/cardCreate.spec.ts
Task: T017 Add top-level navigation item and active-state handling in frontend/src/components/uiParts/AppLayout.tsx and frontend/src/utils/routes/topLevelPages.ts
```

### User Story 3

```bash
Task: T019 Add preview, reset, and unsaved-changes coverage in tests/frontend/cardCreate.test.tsx
Task: T020 Add preview and reset journey coverage in tests/e2e/cardCreate.spec.ts
Task: T021 Implement draft parsing, tag normalization, and field-level validation state in frontend/src/domain/cardCreate.ts and frontend/src/pages/CardCreate.tsx
Task: T022 Implement preview and reset UI in frontend/src/components/uniqueParts/CardCreatePreview.tsx and frontend/src/components/uniqueParts/CardCreateForm.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して `/cards/create` のページ配置、型、UI 部品の土台を揃える
2. Phase 2 を完了して POST `/api/cards` 契約、永続化、成功メッセージ、パンくず基盤を整える
3. Phase 3 を完了して登録画面から新規カード保存と一覧復帰までの最短フローを成立させる
4. User Story 1 を単独検証し、MVP として成立することを確認する

### Incremental Delivery

1. User Story 2 でヘッダーメニューとカード一覧右上の導線を整える
2. User Story 3 でプレビュー、リセット、未保存注意を追加して入力体験を改善する
3. 最後に API 文書、Storybook、アクセシビリティ、性能、lint、テストをまとめて整える