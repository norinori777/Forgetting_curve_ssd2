# タスク: Review Screen

**入力**: `/specs/001-review-screen/` にある設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`

**テスト**: この機能では `spec.md` の User Scenarios & Testing、`quickstart.md`、`test.md` に従い、各ユーザーストーリーに自動テストを含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: review feature の実装先ファイルと共通ヘルパーの土台を揃える

- [X] T001 Create review feature scaffolds in backend/src/domain/review.ts, backend/src/repositories/reviewSessionRepository.ts, frontend/src/domain/review.ts, frontend/src/utils/reviewSessionStorage.ts, and frontend/src/utils/routes/reviewSession.ts
- [X] T002 [P] Create review UI scaffolds in frontend/src/components/uiParts/ReviewProgressHeader.tsx, frontend/src/components/uniqueParts/ReviewAssessmentControls.tsx, and frontend/src/components/uniqueParts/ReviewCompletionSummary.tsx
- [X] T003 [P] Create review test scaffolds in tests/frontend/review.test.tsx and tests/e2e/review-screen.spec.ts

**Checkpoint**: review feature を実装するファイル配置と共通ヘルパーの受け皿が揃う

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーに共通する永続化、契約、API、client 基盤を整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T004 Setup review session persistence in prisma/schema.prisma and prisma/migrations/20260322_add_review_session_tables/migration.sql
- [X] T005 [P] Implement review session repository primitives in backend/src/repositories/reviewSessionRepository.ts and backend/src/domain/review.ts
- [X] T006 [P] Extend review request/response schemas with review reason fields in backend/src/schemas/review.ts and frontend/src/domain/review.ts
- [X] T006a [P] Define cached snapshot and pending-assessment storage shapes in frontend/src/domain/review.ts and frontend/src/utils/reviewSessionStorage.ts
- [X] T007 Wire foundational review routes and API contracts in backend/src/api/review.ts, backend/src/routes/review.ts, backend/contracts/openapi.yaml, and specs/001-review-screen/contracts/openapi.yaml
- [X] T008 Configure review API client, resume storage, and offline snapshot plumbing in frontend/src/services/api/reviewApi.ts, frontend/src/utils/reviewSessionStorage.ts, and frontend/src/utils/routes/reviewSession.ts

**Checkpoint**: session 永続化、snapshot 契約、review API、frontend client 基盤が揃い、各ユーザーストーリーに着手できる

---

## Phase 3: User Story 1 - 1枚ずつ復習する (Priority: P1) 🎯 MVP

**Goal**: 現在カードの表示、回答表示、自己評価、明示的な next 制御を備えた review の基本ループを成立させる

**Independent Test**: カード一覧から復習開始し、Review 画面で「問題確認 → 回答表示 → 自己評価 → 明示的 next」までを 1 枚分完了できること

### Tests for User Story 1

- [X] T009 [P] [US1] Add review start, snapshot load, assessment overwrite, and next-blocking coverage in tests/backend/review.test.ts
- [X] T010 [P] [US1] Add one-card review loop coverage in tests/frontend/review.test.tsx
- [X] T010a [P] [US1] Add keyboard shortcut coverage for answer reveal and four-level assessment in tests/frontend/review.test.tsx
- [X] T011 [P] [US1] Add MVP review journey coverage in tests/e2e/review-screen.spec.ts

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement session creation, current-card snapshot loading, and assessment save rules in backend/src/repositories/reviewSessionRepository.ts and backend/src/api/review.ts
- [X] T013 [P] [US1] Implement review progress and assessment UI in frontend/src/components/uiParts/ReviewProgressHeader.tsx and frontend/src/components/uniqueParts/ReviewAssessmentControls.tsx
- [X] T014 [US1] Replace the placeholder page with the one-card review orchestrator in frontend/src/pages/Review.tsx and frontend/src/services/api/reviewApi.ts
- [X] T014a [US1] Implement keyboard shortcuts for answer reveal and four-level assessment in frontend/src/pages/Review.tsx and frontend/src/components/uniqueParts/ReviewAssessmentControls.tsx
- [X] T015 [US1] Navigate from card list into snapshot-backed review sessions in frontend/src/pages/CardList.tsx and frontend/src/utils/routes/reviewSession.ts

**Checkpoint**: User Story 1 を単独で実行し、復習の基本ループを完了できる

---

## Phase 4: User Story 2 - 進捗を把握しながら操作する (Priority: P2)

**Goal**: 進捗表示、前後移動、一覧へ戻る、同一 session 再開を安定して扱えるようにする

**Independent Test**: 複数カードの session で進捗、prev/next、一覧離脱後の resume を確認できること

### Tests for User Story 2

- [X] T016 [P] [US2] Add navigation, resume snapshot, and previous-card lock coverage in tests/backend/review.test.ts
- [X] T017 [P] [US2] Add progress and resume behavior coverage in tests/frontend/review.test.tsx
- [X] T017a [P] [US2] Add review reason display coverage in tests/frontend/review.test.tsx
- [X] T017b [P] [US2] Add session identifier visibility and hierarchy coverage in tests/frontend/review.test.tsx
- [X] T018 [P] [US2] Add leave-and-resume journey coverage in tests/e2e/review-screen.spec.ts

### Implementation for User Story 2

- [X] T019 [P] [US2] Implement previous/next navigation and lock-after-advance rules in backend/src/repositories/reviewSessionRepository.ts and backend/src/api/review.ts
- [X] T020 [P] [US2] Implement sessionId parsing and persisted resume lookup in frontend/src/utils/routes/reviewSession.ts, frontend/src/utils/reviewSessionStorage.ts, and frontend/src/services/api/reviewApi.ts
- [X] T021 [US2] Surface progress, filter summary, prev/next actions, and list-return resume behavior in frontend/src/pages/Review.tsx and frontend/src/pages/CardList.tsx
- [X] T021a [US2] Surface review reason alongside supplementary card metadata in frontend/src/pages/Review.tsx and frontend/src/components/uiParts/ReviewProgressHeader.tsx
- [X] T021b [US2] Surface session identifier as low-emphasis supplementary metadata in frontend/src/pages/Review.tsx and frontend/src/components/uiParts/ReviewProgressHeader.tsx

**Checkpoint**: User Story 2 を単独で実行し、複数カード session の移動と再開を確認できる

---

## Phase 5: User Story 3 - 完了時と失敗時に迷わない (Priority: P3)

**Goal**: 空状態、開始失敗、取得失敗、完了サマリを明確に表示し、次の行動を選べるようにする

**Independent Test**: no cards、invalid/missing session、completed session を発生させ、説明文と操作導線が表示されること

### Tests for User Story 3

- [X] T022 [P] [US3] Add no-card start failure, missing-session, temporary network failure, and completed-summary coverage in tests/backend/review.test.ts
- [X] T023 [P] [US3] Add empty, error, cached-snapshot fallback, and completed-state coverage in tests/frontend/review.test.tsx
- [X] T023a [P] [US3] Add pending-assessment local-save and resend coverage in tests/frontend/review.test.tsx
- [X] T024 [P] [US3] Add completion and failure journey coverage in tests/e2e/review-screen.spec.ts
- [X] T024a [P] [US3] Add temporary network failure recovery journey coverage in tests/e2e/review-screen.spec.ts

### Implementation for User Story 3

- [X] T025 [P] [US3] Implement empty-state, error-state, temporary failure handling, and completed-summary responses in backend/src/repositories/reviewSessionRepository.ts and backend/src/api/review.ts
- [X] T026 [P] [US3] Implement review completion summary presentation in frontend/src/components/uniqueParts/ReviewCompletionSummary.tsx
- [X] T027 [US3] Implement empty, retry, cached-snapshot fallback, and completed-screen flows in frontend/src/pages/Review.tsx and frontend/src/services/api/reviewApi.ts
- [X] T027a [US3] Implement pending-assessment local save and resend flows in frontend/src/pages/Review.tsx, frontend/src/services/api/reviewApi.ts, and frontend/src/utils/reviewSessionStorage.ts

**Checkpoint**: User Story 3 を単独で実行し、終了時と失敗時の導線を確認できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント、Storybook、総合検証を最終整合する

- [X] T028 [P] Sync review session documentation for review reason and fallback behavior in backend/contracts/openapi.yaml, specs/001-review-screen/contracts/openapi.yaml, and specs/001-review-screen/quickstart.md
- [X] T029 [P] Add Storybook coverage for review controls in frontend/src/stories/ReviewAssessmentControls.stories.tsx and frontend/src/stories/ReviewCompletionSummary.stories.tsx
- [X] T030 Run lint, unit/integration, and E2E validation via package.json, backend/package.json, frontend/package.json, tests/backend/review.test.ts, tests/frontend/review.test.tsx, and tests/e2e/review-screen.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。すぐ開始できる
- **Foundational (Phase 2)**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **User Story 1 (Phase 3)**: Phase 2 完了後に開始できる。MVP の最小範囲
- **User Story 2 (Phase 4)**: Phase 2 完了後に開始できる。US1 の基盤を再利用するが、複数カード session と resume の観点で独立検証できる
- **User Story 3 (Phase 5)**: Phase 2 完了後に開始できる。US1/US2 の session 基盤上で空・失敗・完了状態を独立検証できる
- **Polish (Phase 6)**: 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- **User Story 1 (P1)**: Foundational のみ依存。review screen の MVP
- **User Story 2 (P2)**: Foundational のみ依存。US1 の画面/API を再利用しても、進捗表示と resume の観点で単独検証できる
- **User Story 3 (P3)**: Foundational のみ依存。completion/error handling の観点で単独検証できる

### Within Each User Story

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- 永続化/契約/API を先に整え、その後 UI 統合へ進む
- 各ストーリーが単独で通る状態を作ってから次の優先度へ進む

---

## Parallel Examples

### User Story 1

```bash
Task: T009 Add review start, snapshot load, assessment overwrite, and next-blocking coverage in tests/backend/review.test.ts
Task: T010 Add one-card review loop coverage in tests/frontend/review.test.tsx
Task: T010a Add keyboard shortcut coverage for answer reveal and four-level assessment in tests/frontend/review.test.tsx
Task: T011 Add MVP review journey coverage in tests/e2e/review-screen.spec.ts
Task: T013 Implement review progress and assessment UI in frontend/src/components/uiParts/ReviewProgressHeader.tsx and frontend/src/components/uniqueParts/ReviewAssessmentControls.tsx
```

### User Story 2

```bash
Task: T016 Add navigation, resume snapshot, and previous-card lock coverage in tests/backend/review.test.ts
Task: T017 Add progress and resume behavior coverage in tests/frontend/review.test.tsx
Task: T017a Add review reason display coverage in tests/frontend/review.test.tsx
Task: T017b Add session identifier visibility and hierarchy coverage in tests/frontend/review.test.tsx
Task: T018 Add leave-and-resume journey coverage in tests/e2e/review-screen.spec.ts
Task: T020 Implement sessionId parsing and persisted resume lookup in frontend/src/utils/routes/reviewSession.ts, frontend/src/utils/reviewSessionStorage.ts, and frontend/src/services/api/reviewApi.ts
```

### User Story 3

```bash
Task: T022 Add no-card start failure, missing-session, temporary network failure, and completed-summary coverage in tests/backend/review.test.ts
Task: T023 Add empty, error, cached-snapshot fallback, and completed-state coverage in tests/frontend/review.test.tsx
Task: T023a Add pending-assessment local-save and resend coverage in tests/frontend/review.test.tsx
Task: T024 Add completion and failure journey coverage in tests/e2e/review-screen.spec.ts
Task: T024a Add temporary network failure recovery journey coverage in tests/e2e/review-screen.spec.ts
Task: T026 Implement review completion summary presentation in frontend/src/components/uniqueParts/ReviewCompletionSummary.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して review feature の新規ファイルと test 受け皿を揃える
2. Phase 2 を完了して session 永続化、snapshot 契約、frontend API client を整える
3. Phase 3 を完了して one-card review loop を成立させる
4. User Story 1 を単独で検証してから次フェーズへ進む

### Incremental Delivery

1. User Story 2 で progress / navigation / resume を追加する
2. User Story 3 で empty / error / completed summary に加えて cached snapshot fallback と pending-assessment resend を追加する
3. 最後に Storybook、OpenAPI、quickstart、lint、unit/integration、E2E を整える
