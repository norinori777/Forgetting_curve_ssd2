# タスク: 設定画面コレクション登録 (001-collection-settings)

**入力**: `specs/001-collection-settings/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`

**テスト**: この機能では `spec.md` の User Scenarios & Testing、`plan.md` の Test strategy、`test.md` の最低要件に従い、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 設定画面のコレクション管理 feature を配置するファイル構造とフロント/バック双方の土台を整える

- [x] T001 Create collection settings domain and API client scaffolds in `frontend/src/domain/collectionSettings.ts` and `frontend/src/services/api/collectionSettingsApi.ts`
- [x] T002 [P] Create collection management UI component shells in `frontend/src/components/uniqueParts/CollectionCreateForm.tsx`, `frontend/src/components/uniqueParts/CollectionManagementList.tsx`, `frontend/src/components/uniqueParts/CollectionEditModal.tsx`, and `frontend/src/components/uniqueParts/CollectionDeleteDialog.tsx`
- [x] T003 [P] Create backend collection management schema and owner-context scaffolds in `backend/src/schemas/collections.ts` and `backend/src/services/collectionOwnerContext.ts`

**Checkpoint**: コレクション管理機能のページ・型・部品・server-side context の配置先が揃う

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーに共通する永続化、契約、API 基盤を整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [x] T004 Add collection management persistence fields and migration in `prisma/schema.prisma` and `prisma/migrations/`
- [x] T005 [P] Define collection management API contracts in `specs/001-collection-settings/contracts/openapi.yaml` and `backend/contracts/openapi.yaml`
- [x] T006 [P] Implement collection management repository primitives and read model mapping in `backend/src/repositories/collectionRepository.ts`
- [x] T007 Implement `/api/collections/manage` routing, validation, owner resolution, and PII-safe logging in `backend/src/api/collections.ts`, `backend/src/schemas/collections.ts`, `backend/src/services/collectionOwnerContext.ts`, and `backend/src/index.ts`
- [x] T008 [P] Define collection settings message keys and UI state primitives in `docs/messages.md` and `frontend/src/domain/collectionSettings.ts`

**Checkpoint**: Collection schema、管理系 API 契約、repository、message key、owner context が揃い、各ストーリーの実装に着手できる

---

## Phase 3: User Story 1 - 設定画面から新しいコレクションを登録する (Priority: P1) 🎯 MVP

**Goal**: 設定画面で既存一覧を見ながら新しいコレクションを登録し、成功直後に一覧へ反映できるようにする

**Independent Test**: `/settings` を直接開き、コレクション名を入力して登録すると一覧に新しいコレクションが追加され、空状態・成功表示・必須エラーが確認できること

### Tests for User Story 1

- [x] T009 [P] [US1] Add managed-collections list/create API coverage in `tests/backend/collections.test.ts`
- [x] T010 [P] [US1] Add settings-page create flow coverage in `tests/frontend/settingsCollections.test.tsx`
- [x] T011 [P] [US1] Add create-collection happy-path E2E coverage in `tests/e2e/settingsCollections.spec.ts`

### Implementation for User Story 1

- [x] T012 [US1] Implement list-managed-collections and create-collection persistence in `backend/src/repositories/collectionRepository.ts`
- [x] T013 [US1] Implement create/list handlers and create-specific error responses in `backend/src/api/collections.ts`
- [x] T014 [P] [US1] Build collection create form and empty-state UI in `frontend/src/components/uniqueParts/CollectionCreateForm.tsx` and `frontend/src/components/uniqueParts/CollectionManagementList.tsx`
- [x] T015 [US1] Integrate `/settings` list/create flow and success messaging in `frontend/src/pages/Settings.tsx`, `frontend/src/domain/collectionSettings.ts`, and `frontend/src/services/api/collectionSettingsApi.ts`

**Checkpoint**: User Story 1 を単独で実行し、設定画面でコレクションの一覧取得・新規登録・成功反映を確認できる

---

## Phase 4: User Story 2 - 既存コレクションを変更または削除する (Priority: P2)

**Goal**: 一覧の各行から編集モーダルを開いて更新し、削除可能なコレクションだけを確認付きで削除できるようにする

**Independent Test**: `/settings` で既存コレクションの `編集` からモーダル更新ができ、カード未所属コレクションだけが削除され、利用中コレクションは削除不可理由が表示されること

### Tests for User Story 2

- [x] T016 [P] [US2] Add update/delete and delete-blocked API coverage in `tests/backend/collections.test.ts`
- [x] T017 [P] [US2] Add edit-modal and delete-dialog UI coverage in `tests/frontend/settingsCollections.test.tsx`
- [x] T018 [P] [US2] Add update/delete management E2E coverage in `tests/e2e/settingsCollections.spec.ts`

### Implementation for User Story 2

- [x] T019 [US2] Implement collection update, delete guard, and delete response handling in `backend/src/repositories/collectionRepository.ts`
- [x] T020 [US2] Implement PATCH/DELETE handlers and `collection_in_use` error mapping in `backend/src/api/collections.ts`
- [x] T021 [P] [US2] Build edit modal and delete confirmation/blocked UI in `frontend/src/components/uniqueParts/CollectionEditModal.tsx` and `frontend/src/components/uniqueParts/CollectionDeleteDialog.tsx`
- [x] T022 [US2] Wire row-level edit/delete actions into the settings list in `frontend/src/components/uniqueParts/CollectionManagementList.tsx`, `frontend/src/pages/Settings.tsx`, and `frontend/src/services/api/collectionSettingsApi.ts`

**Checkpoint**: User Story 2 を単独で実行し、変更モーダル、削除確認、削除不可ガードを確認できる

---

## Phase 5: User Story 3 - 入力失敗時にもやり直せる (Priority: P3)

**Goal**: 重複名や不正入力、通信失敗、キャンセル時にも入力内容と一覧文脈を失わずに再試行できるようにする

**Independent Test**: `/settings` で重複名作成・重複名更新・一時失敗・モーダルキャンセルを再現し、修正や再試行がその場でできること

### Tests for User Story 3

- [x] T023 [P] [US3] Add duplicate-name and validation failure API coverage in `tests/backend/collections.test.ts`
- [x] T024 [P] [US3] Add retry, reset, and modal-cancel UI coverage in `tests/frontend/settingsCollections.test.tsx`
- [x] T025 [P] [US3] Add retry/cancel E2E coverage in `tests/e2e/settingsCollections.spec.ts`

### Implementation for User Story 3

- [x] T026 [US3] Implement normalized-name validation and duplicate-name repository errors in `backend/src/schemas/collections.ts` and `backend/src/repositories/collectionRepository.ts`
- [x] T027 [US3] Implement preserved draft, retry, and failure state handling in `frontend/src/domain/collectionSettings.ts` and `frontend/src/pages/Settings.tsx`
- [x] T028 [US3] Implement reset, cancel-without-save, and inline error messaging in `frontend/src/components/uniqueParts/CollectionCreateForm.tsx`, `frontend/src/components/uniqueParts/CollectionEditModal.tsx`, and `frontend/src/components/uniqueParts/CollectionDeleteDialog.tsx`

**Checkpoint**: User Story 3 を単独で実行し、重複エラー、通信失敗、再試行、キャンセル時の UI 安全性を確認できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント、Storybook、アクセシビリティ、性能、最終検証を整える

- [x] T029 [P] Sync collection settings documentation in `specs/001-collection-settings/quickstart.md`, `specs/001-collection-settings/contracts/openapi.yaml`, `backend/contracts/openapi.yaml`, and `docs/messages.md`
- [x] T030 [P] Add Storybook coverage for collection settings UI in `frontend/src/stories/CollectionCreateForm.stories.tsx`, `frontend/src/stories/CollectionManagementList.stories.tsx`, and `frontend/src/stories/CollectionEditModal.stories.tsx`
- [x] T031 [P] Update accessibility and performance checks for settings collection management in `frontend/accessibility-audit.md`, `tests/frontend/settingsCollections.test.tsx`, and `tests/perf/settingsCollections.perf.test.ts`
- [x] T032 Run lint, unit/integration, and E2E validation via `package.json`, `backend/package.json`, `frontend/package.json`, `tests/backend/collections.test.ts`, `tests/frontend/settingsCollections.test.tsx`, and `tests/e2e/settingsCollections.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。すぐ開始できる
- **Foundational (Phase 2)**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **User Story 1 (Phase 3)**: Phase 2 完了後に開始できる。MVP の最小価値
- **User Story 2 (Phase 4)**: Phase 2 完了後に開始できる。US1 の一覧取得基盤を再利用するが、独立検証できる
- **User Story 3 (Phase 5)**: Phase 2 完了後に開始できる。US1/US2 の mutation を対象に失敗系を強化する
- **Polish (Phase 6)**: 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- **User Story 1 (P1)**: Foundational のみ依存。MVP として先に実装・検証する
- **User Story 2 (P2)**: Foundational のみ依存。作成ストーリーとは別に変更/削除フローを独立実装できる
- **User Story 3 (P3)**: Foundational のみ依存。create/update/delete の失敗系を対象にするため US1/US2 完了後の着手が最も効率的

### Within Each User Story

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- backend の schema / repository / api を先に整え、その後 frontend の state と UI 統合へ進む
- ページ統合前に presentational component を分け、1 ストーリーが独立して通る状態を作ってから次の優先度へ進む

### Parallel Opportunities

- Phase 1 の `T002` と `T003` は並列実行可能
- Phase 2 の `T005`、`T006`、`T008` は並列実行可能
- User Story 1 の `T009`、`T010`、`T011`、`T014` は並列実行可能
- User Story 2 の `T016`、`T017`、`T018`、`T021` は並列実行可能
- User Story 3 の `T023`、`T024`、`T025` は並列実行可能
- Polish の `T029`、`T030`、`T031` は並列実行可能

---

## Parallel Example: User Story 1

```bash
Task: "T009 Add managed-collections list/create API coverage in tests/backend/collections.test.ts"
Task: "T010 Add settings-page create flow coverage in tests/frontend/settingsCollections.test.tsx"
Task: "T011 Add create-collection happy-path E2E coverage in tests/e2e/settingsCollections.spec.ts"
Task: "T014 Build collection create form and empty-state UI in frontend/src/components/uniqueParts/CollectionCreateForm.tsx and frontend/src/components/uniqueParts/CollectionManagementList.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T016 Add update/delete and delete-blocked API coverage in tests/backend/collections.test.ts"
Task: "T017 Add edit-modal and delete-dialog UI coverage in tests/frontend/settingsCollections.test.tsx"
Task: "T018 Add update/delete management E2E coverage in tests/e2e/settingsCollections.spec.ts"
Task: "T021 Build edit modal and delete confirmation/blocked UI in frontend/src/components/uniqueParts/CollectionEditModal.tsx and frontend/src/components/uniqueParts/CollectionDeleteDialog.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T023 Add duplicate-name and validation failure API coverage in tests/backend/collections.test.ts"
Task: "T024 Add retry, reset, and modal-cancel UI coverage in tests/frontend/settingsCollections.test.tsx"
Task: "T025 Add retry/cancel E2E coverage in tests/e2e/settingsCollections.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して collection settings の domain、API client、UI 部品の配置を揃える
2. Phase 2 を完了して Prisma schema、管理系 API、owner context、message key を整える
3. Phase 3 を完了して `/settings` での一覧取得と新規登録の最短フローを成立させる
4. User Story 1 を単独検証し、MVP として成立することを確認する

### Incremental Delivery

1. User Story 2 で編集モーダル、削除確認、削除不可 guard を追加する
2. User Story 3 で重複エラー、再試行、キャンセル安全性を追加して運用時の失敗耐性を上げる
3. 最後に Storybook、アクセシビリティ、性能、lint、unit/integration、E2E をまとめて確認する