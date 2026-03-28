# タスク: 学習カードCSV一括登録 (001-csv-card-import)

**入力**: `specs/001-csv-card-import/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/openapi.yaml`

**テスト**: `spec.md` の受け入れ条件と `plan.md` の Test strategy に従い、各ユーザーストーリーで自動テストを追加する。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 5 列 CSV 一括登録の実装に必要な依存関係、fixture、カタログの作業面を揃える

- [X] T001 Align CSV import message keys and helper copy in docs/messages.md
- [X] T002 [P] Prepare 5-column CSV fixtures for happy-path and invalid cases in tests/fixtures/csv/cards-import-valid.csv and tests/fixtures/csv/cards-import-invalid.csv
- [X] T003 [P] Confirm CSV import dependency and test script wiring in frontend/package.json, backend/package.json, and package.json

**Checkpoint**: CSV import 用の文言、fixture、依存関係の前提が揃う

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーで共有する domain、schema、contract、repository、画面状態を先に整える

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T004 Define shared CSV import domain types, phase state, and summary shapes in frontend/src/domain/cardCsvImport.ts
- [X] T005 [P] Add validate/import request and response schemas for 5-column rows in backend/src/schemas/cards.ts
- [X] T006 [P] Sync validate/import API contract for optional answer handling in specs/001-csv-card-import/contracts/openapi.yaml and backend/contracts/openapi.yaml
- [X] T007 [P] Implement collection resolution, tag upsert, and transaction helper primitives in backend/src/repositories/cardRepository.ts
- [X] T008 Add CSV mode shell and import state ownership in frontend/src/pages/CardCreate.tsx and frontend/src/components/uniqueParts/CardCreateForm.tsx
- [X] T009 [P] Add validate/import API client shells in frontend/src/services/api/cardCsvImportApi.ts

**Checkpoint**: CSV import の契約、永続化 helper、画面状態基盤が揃い、各ストーリーへ進める

---

## Phase 3: User Story 1 - CSVからカードをまとめて登録する (Priority: P1) 🎯 MVP

**Goal**: 正常な 5 列 CSV をアップロードし、回答列を含むカードをまとめて登録して一覧へ戻れるようにする

**Independent Test**: [frontend/src/pages/CardCreate.tsx](frontend/src/pages/CardCreate.tsx) から 5 列 CSV をアップロードし、プレビュー確認後に一括登録を実行すると、CSV 内の全カードが保存され、回答列に値がある行は回答付きで一覧に反映されること

### Tests for User Story 1

- [X] T010 [P] [US1] Add validate/import happy-path backend coverage for optional answer persistence in tests/backend/cards.test.ts
- [X] T011 [P] [US1] Add 5-column CSV import happy-path UI coverage in tests/frontend/cardCreate.test.tsx
- [X] T012 [P] [US1] Add end-to-end bulk import success journey coverage in tests/e2e/cardCsvImport.spec.ts

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement supported-encoding decode and 5-column row normalization in frontend/src/domain/cardCsvImport.ts and tests/helpers/csv.ts
- [X] T014 [US1] Implement validate/import submit orchestration for normalized rows in frontend/src/services/api/cardCsvImportApi.ts and frontend/src/pages/CardCreate.tsx
- [X] T015 [US1] Implement transactional bulk card creation with optional answer persistence in backend/src/repositories/cardRepository.ts and backend/src/api/cards.ts
- [X] T016 [P] [US1] Build CSV upload, preview submit, and importing states in frontend/src/components/uniqueParts/CardCsvImportPanel.tsx and frontend/src/pages/CardCreate.tsx
- [X] T017 [US1] Show imported-count success feedback after redirect in frontend/src/pages/CardList.tsx and docs/messages.md

**Checkpoint**: User Story 1 単独で CSV 一括登録の最短フローが成立する

---

## Phase 4: User Story 2 - 形式エラーを事前に把握する (Priority: P2)

**Goal**: 5 列不足、必須値不足、存在しないコレクション、未対応文字コードを行番号付きで把握し、エラー中は登録できないようにする

**Independent Test**: 5 列未満、タイトルまたは学習内容の欠落、存在しないコレクション、未対応文字コードを含む CSV をそれぞれアップロードすると、行番号付きエラーが表示され、一括登録が実行されないこと

### Tests for User Story 2

- [X] T018 [P] [US2] Add invalid CSV validation and rollback guard coverage in tests/backend/cards.test.ts
- [X] T019 [P] [US2] Add row-level issue rendering and import-disabled UI coverage in tests/frontend/cardCreate.test.tsx
- [X] T020 [P] [US2] Add invalid CSV recovery journey coverage in tests/e2e/cardCsvImport.spec.ts

### Implementation for User Story 2

- [X] T021 [US2] Implement structural CSV validation for row length, header skipping, and encoding failures in frontend/src/domain/cardCsvImport.ts and frontend/src/pages/CardCreate.tsx
- [X] T022 [US2] Implement authoritative server-side row validation and collection mismatch reporting in backend/src/schemas/cards.ts, backend/src/api/cards.ts, and backend/src/repositories/cardRepository.ts
- [X] T023 [P] [US2] Render row-level issue list and validation status table in frontend/src/components/uniqueParts/CardCsvImportIssueList.tsx and frontend/src/components/uniqueParts/CardCsvImportPreviewTable.tsx
- [X] T024 [US2] Block import on any validation issue and support corrected-file retry flow in frontend/src/pages/CardCreate.tsx and frontend/src/services/api/cardCsvImportApi.ts

**Checkpoint**: User Story 2 単独でエラー把握と再アップロード導線を検証できる

---

## Phase 5: User Story 3 - 取り込み前に登録対象を確認する (Priority: P3)

**Goal**: 登録予定件数、ヘッダー読み飛ばし有無、主要列の要約を確認し、別ファイル選択やキャンセルで状態を安全に切り替えられるようにする

**Independent Test**: 正常 CSV をアップロードすると summary とプレビュー行が表示され、別ファイル選択で結果が置き換わり、キャンセルやモード切り替えで import 状態がクリアされること

### Tests for User Story 3

- [X] T025 [P] [US3] Add preview summary, replace-file, and cancel UI coverage in tests/frontend/cardCreate.test.tsx
- [X] T026 [P] [US3] Add preview-and-cancel end-to-end journey coverage in tests/e2e/cardCsvImport.spec.ts

### Implementation for User Story 3

- [X] T027 [P] [US3] Implement summary cards and sample-row presentation including answer column in frontend/src/components/uniqueParts/CardCsvImportPreviewTable.tsx and frontend/src/components/uniqueParts/CardCsvImportPanel.tsx
- [X] T028 [US3] Implement file replacement, cancel reset, and mode-switch state clearing in frontend/src/domain/cardCsvImport.ts and frontend/src/pages/CardCreate.tsx
- [X] T029 [US3] Return validation summary metadata including headerSkipped, validRows, and invalidRows in backend/src/api/cards.ts and backend/src/repositories/cardRepository.ts

**Checkpoint**: User Story 3 単独で登録前確認と状態リセットを検証できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント、Storybook、アクセシビリティ、性能、最終検証を横断的に整える

- [X] T030 [P] Sync CSV import documentation and manual verification steps in specs/001-csv-card-import/quickstart.md, specs/001-csv-card-import/ascii_ui.txt, and frontend/accessibility-audit.md
- [X] T031 [P] Add Storybook coverage for CSV import panel and preview states in frontend/src/stories/CardCsvImportPanel.stories.tsx and frontend/src/stories/CardCsvImportPreviewTable.stories.tsx
- [X] T032 [P] Add performance and regression coverage for card create CSV mode in tests/perf/initialRender.test.tsx and tests/frontend/cardCreate.test.tsx
- [X] T033 Run lint, unit, integration, and end-to-end validation through package.json, backend/package.json, and frontend/package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: 依存なし。すぐ開始できる
- **Phase 2: Foundational**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **Phase 3: User Story 1**: Phase 2 完了後に開始できる。MVP の最小価値
- **Phase 4: User Story 2**: Phase 2 完了後に開始できる。US1 とは独立に CSV エラー検証を進められる
- **Phase 5: User Story 3**: Phase 2 完了後に開始できる。US1 と組み合わせると完成度が上がるが、確認 UI 自体は独立して進められる
- **Phase 6: Polish**: 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- **US1 (P1)**: Foundational 完了後に着手可能。ほかの user story への依存はない
- **US2 (P2)**: Foundational 完了後に着手可能。US1 の保存成功導線とは独立に検証できる
- **US3 (P3)**: Foundational 完了後に着手可能。US1 の validate/import 実装と統合すると完成するが、プレビューと状態管理は独立して実装できる

### Within Each User Story

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- フロントの domain / API client とバックエンドの schema / repository / API を揃えてから UI 統合へ進む
- 各ストーリーが単独で受け入れ条件を満たす状態を作ってから次の優先度へ進む

---

## Parallel Examples

### User Story 1

```text
T010 tests/backend/cards.test.ts
T011 tests/frontend/cardCreate.test.tsx
T012 tests/e2e/cardCsvImport.spec.ts
T013 frontend/src/domain/cardCsvImport.ts + tests/helpers/csv.ts
T016 frontend/src/components/uniqueParts/CardCsvImportPanel.tsx + frontend/src/pages/CardCreate.tsx
```

### User Story 2

```text
T018 tests/backend/cards.test.ts
T019 tests/frontend/cardCreate.test.tsx
T020 tests/e2e/cardCsvImport.spec.ts
T023 frontend/src/components/uniqueParts/CardCsvImportIssueList.tsx + frontend/src/components/uniqueParts/CardCsvImportPreviewTable.tsx
```

### User Story 3

```text
T025 tests/frontend/cardCreate.test.tsx
T026 tests/e2e/cardCsvImport.spec.ts
T027 frontend/src/components/uniqueParts/CardCsvImportPreviewTable.tsx + frontend/src/components/uniqueParts/CardCsvImportPanel.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して CSV import 用の文言、fixture、依存関係を揃える
2. Phase 2 を完了して shared domain、schema、contract、repository helper、画面状態基盤を整える
3. Phase 3 を完了して正常 CSV のプレビュー確認から一括登録、一覧復帰までの最短フローを成立させる
4. User Story 1 を単独で検証し、MVP として成立することを確認する

### Incremental Delivery

1. User Story 2 で行番号付き validation issue と import ブロックを完成させる
2. User Story 3 で summary、別ファイル選択、キャンセル、状態クリアを完成させる
3. 最後に Storybook、ドキュメント、アクセシビリティ、性能、lint、テストをまとめて整える
