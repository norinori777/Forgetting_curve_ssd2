# タスク: 学習カード登録の回答入力項目 (001-card-answer-input)

**入力**: `specs/001-card-answer-input/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`、`quickstart.md`

**テスト**: この機能では `spec.md` の User Scenarios & Testing と `test.md` の最低要件に従い、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 回答入力と永続化を受け入れるための共有データ定義と API 契約の土台を整える

- [X] T001 Update the optional `answer` field on the shared card schema in prisma/schema.prisma
- [X] T002 [P] Extend create-card request and response types for `answer` in frontend/src/domain/cardCreate.ts and backend/src/domain/cardList.ts
- [X] T003 [P] Update the feature contract for optional multiline `answer` payloads in specs/001-card-answer-input/contracts/openapi.yaml

**Checkpoint**: DB schema、共有型、契約の前提が揃う

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーが依存する create API と draft 正規化基盤を整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T004 Update create-card API validation and normalization entry points in backend/src/schemas/cards.ts and backend/src/api/cards.ts
- [X] T005 [P] Implement answer-aware card persistence and response mapping in backend/src/repositories/cardRepository.ts
- [X] T006 [P] Extend card-create draft lifecycle and request serialization for `answer` in frontend/src/domain/cardCreate.ts and frontend/src/services/api/cardCreateApi.ts
- [X] T007 [P] Sync local development validation steps for answer schema changes in specs/001-card-answer-input/quickstart.md
- [X] T008 Apply the updated Prisma schema to the development workflow using prisma/schema.prisma and verify `npx prisma db push` / `npx prisma generate`

**Checkpoint**: create API、draft 正規化、開発DB同期手順が揃い、各ストーリーを独立実装できる

---

## Phase 3: User Story 1 - 回答付きで学習カードを登録する (Priority: P1) 🎯 MVP

**Goal**: 回答を入力した学習カードを登録し、保存結果とプレビューで回答内容を確認できるようにする

**Independent Test**: `/cards/create` でタイトル・学習内容・複数行回答を入力して登録し、保存レスポンスと登録前プレビューに回答が反映されること

### Tests for User Story 1

- [X] T009 [P] [US1] Add create API coverage for answer-bearing payloads in tests/backend/cards.test.ts
- [X] T010 [P] [US1] Add card-create UI coverage for answer input and full preview rendering in tests/frontend/cardCreate.test.tsx and tests/e2e/cardCreate.spec.ts

### Implementation for User Story 1

- [X] T011 [P] [US1] Add optional multiline answer input to the registration form in frontend/src/components/uniqueParts/CardCreateForm.tsx
- [X] T012 [P] [US1] Add full answer preview rendering in frontend/src/components/uniqueParts/CardCreatePreview.tsx
- [X] T013 [US1] Wire answer draft state, submit handling, and preview props in frontend/src/pages/CardCreate.tsx
- [X] T014 [US1] Persist non-empty answer values through `POST /api/cards` in backend/src/api/cards.ts and backend/src/repositories/cardRepository.ts

**Checkpoint**: 回答付きカードを単独で登録でき、登録前後で回答を確認できる

---

## Phase 4: User Story 2 - 回答なしでも学習カードを登録する (Priority: P1)

**Goal**: 回答未入力や空白のみの入力でも既存の登録フローを壊さず、未登録として扱って登録できるようにする

**Independent Test**: 回答欄を空欄または空白のみで登録し、登録自体は成功し、保存結果では回答が未登録扱いになること

### Tests for User Story 2

- [X] T015 [P] [US2] Add create API coverage for null and whitespace-only answers in tests/backend/cards.test.ts
- [X] T016 [P] [US2] Add draft retention and empty-answer submission coverage in tests/frontend/cardCreate.test.tsx and tests/e2e/cardCreate.spec.ts

### Implementation for User Story 2

- [X] T017 [P] [US2] Normalize empty and whitespace-only answers before persistence in backend/src/schemas/cards.ts and backend/src/repositories/cardRepository.ts
- [X] T018 [P] [US2] Preserve optional answer input through draft storage, reset, and retry flows in frontend/src/domain/cardCreate.ts and frontend/src/pages/CardCreate.tsx
- [X] T019 [US2] Ensure empty-answer submissions keep existing create-card UX and messages in frontend/src/components/uniqueParts/CardCreateForm.tsx, frontend/src/pages/CardCreate.tsx, and docs/messages.md

**Checkpoint**: 回答なしカードを既存フローと同じ操作感で登録でき、空白のみも未登録として扱われる

---

## Phase 5: User Story 3 - 長い回答を無理なく入力する (Priority: P2)

**Goal**: 長い複数行回答でも入力中に見やすく、改行を維持したまま登録できるようにする

**Independent Test**: 3 行以上の回答を入力し、フォーム、プレビュー、保存結果のすべてで改行を維持して扱えること

### Tests for User Story 3

- [X] T020 [P] [US3] Add multiline answer boundary coverage in tests/backend/cards.test.ts and tests/frontend/cardCreate.test.tsx
- [X] T021 [P] [US3] Add end-to-end coverage for multiline answer entry and persistence in tests/e2e/cardCreate.spec.ts

### Implementation for User Story 3

- [X] T022 [P] [US3] Tune the multiline answer textarea UX in frontend/src/components/uniqueParts/CardCreateForm.tsx
- [X] T023 [P] [US3] Preserve multiline answer formatting in preview and API payload conversion in frontend/src/components/uniqueParts/CardCreatePreview.tsx and frontend/src/domain/cardCreate.ts
- [X] T024 [US3] Return multiline answer values without collapsing line breaks in backend/src/repositories/cardRepository.ts and frontend/src/services/api/cardCreateApi.ts

**Checkpoint**: 長文・複数行の回答を独立して入力、確認、登録できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント、Storybook、検証コマンド、回帰確認を最終整合する

- [X] T025 [P] Refresh create-card documentation for answer input in specs/001-card-answer-input/spec.md, specs/001-card-answer-input/quickstart.md, and specs/001-card-answer-input/contracts/openapi.yaml
- [X] T026 [P] Refresh answer-enabled Storybook scenarios in frontend/src/stories/CardCreateForm.stories.tsx and frontend/src/stories/CardCreatePreview.stories.tsx
- [X] T027 Run full validation for answer-input registration via package.json, backend/package.json, frontend/package.json, tests/backend/cards.test.ts, tests/frontend/cardCreate.test.tsx, and tests/e2e/cardCreate.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。すぐ開始できる
- **Foundational (Phase 2)**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **User Story 1 (Phase 3)**: Phase 2 完了後に開始できる。MVP として最優先
- **User Story 2 (Phase 4)**: Phase 2 完了後に開始できる。US1 と独立に検証できる
- **User Story 3 (Phase 5)**: Phase 2 完了後に開始できる。US1 / US2 と独立に検証できる
- **Polish (Phase 6)**: 実装対象ストーリー完了後に開始する

### User Story Dependencies

- **User Story 1 (P1)**: Foundational のみ依存。回答付き登録の最小価値を提供する
- **User Story 2 (P1)**: Foundational のみ依存。回答任意入力と未登録正規化を独立検証できる
- **User Story 3 (P2)**: Foundational のみ依存。複数行入力 UX と改行保持を独立検証できる

### Within Each User Story

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- schema / repository / API の順で backend を固め、その後 frontend draft / form / preview を統合する
- 1 ストーリーが単独で通る状態を作ってから次の優先順位へ進む

---

## Parallel Examples

### User Story 1

```bash
Task: T009 Add create API coverage for answer-bearing payloads in tests/backend/cards.test.ts
Task: T010 Add card-create UI coverage for answer input and full preview rendering in tests/frontend/cardCreate.test.tsx and tests/e2e/cardCreate.spec.ts
Task: T011 Add optional multiline answer input to the registration form in frontend/src/components/uniqueParts/CardCreateForm.tsx
Task: T012 Add full answer preview rendering in frontend/src/components/uniqueParts/CardCreatePreview.tsx
```

### User Story 2

```bash
Task: T015 Add create API coverage for null and whitespace-only answers in tests/backend/cards.test.ts
Task: T016 Add draft retention and empty-answer submission coverage in tests/frontend/cardCreate.test.tsx and tests/e2e/cardCreate.spec.ts
Task: T017 Normalize empty and whitespace-only answers before persistence in backend/src/schemas/cards.ts and backend/src/repositories/cardRepository.ts
Task: T018 Preserve optional answer input through draft storage, reset, and retry flows in frontend/src/domain/cardCreate.ts and frontend/src/pages/CardCreate.tsx
```

### User Story 3

```bash
Task: T020 Add multiline answer boundary coverage in tests/backend/cards.test.ts and tests/frontend/cardCreate.test.tsx
Task: T021 Add end-to-end coverage for multiline answer entry and persistence in tests/e2e/cardCreate.spec.ts
Task: T022 Tune the multiline answer textarea UX in frontend/src/components/uniqueParts/CardCreateForm.tsx
Task: T023 Preserve multiline answer formatting in preview and API payload conversion in frontend/src/components/uniqueParts/CardCreatePreview.tsx and frontend/src/domain/cardCreate.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して answer を扱う schema、型、契約を揃える
2. Phase 2 を完了して create API と draft 正規化の基盤を整える
3. Phase 3 を完了して回答付き登録を成立させる
4. User Story 1 を単独で検証してから次フェーズへ進む

### Incremental Delivery

1. User Story 2 で回答任意入力と未登録正規化を完成させる
2. User Story 3 で長文・複数行回答の入力体験を完成させる
3. 最後に docs、Storybook、build / test / e2e をまとめて整える