---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup database schema and migrations framework
- [ ] T005 [P] Implement authentication/authorization framework
- [ ] T006 [P] Setup API routing and middleware structure
- [ ] T007 Create base models/entities that all stories depend on
- [ ] T008 Configure error handling and logging infrastructure
- [ ] T009 Setup environment configuration management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T011 [P] [US1] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create [Entity1] model in src/models/[entity1].py
- [ ] T013 [P] [US1] Create [Entity2] model in src/models/[entity2].py
- [ ] T014 [US1] Implement [Service] in src/services/[service].py (depends on T012, T013)
- [ ] T015 [US1] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T016 [US1] Add validation and error handling
- [ ] T017 [US1] Add logging for user story 1 operations

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T019 [P] [US2] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create [Entity] model in src/models/[entity].py
- [ ] T021 [US2] Implement [Service] in src/services/[service].py
- [ ] T022 [US2] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T023 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T025 [P] [US3] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create [Entity] model in src/models/[entity].py
- [ ] T027 [US3] Implement [Service] in src/services/[service].py
- [ ] T028 [US3] Implement [endpoint/feature] in src/[location]/[file].py

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready
---

description: "機能実装のためのタスクリストテンプレート"
---

# タスク: [機能名]

**入力**: `/specs/[###-feature-name]/` にある設計ドキュメント
**前提条件**: `plan.md`（必須）、`spec.md`（ユーザーストーリー必須）、`research.md`、`data-model.md`、`contracts/`

**テスト**: 以下の例にはテストタスクを含みます。テストは任意です — 機能仕様で明示的に要求されている場合のみ含めてください。

**構成**: タスクはユーザーストーリーごとにグループ化します。各ストーリーを独立して実装・テストできるようにするためです。

## 形式: `[ID] [P?] [Story] 説明`

- **[P]**: 並列実行可能（別ファイルで依存関係がない）
- **[Story]**: このタスクが属するユーザーストーリー（例: US1, US2, US3）
- 説明には必ず正確なファイルパスを含めてください

## パスの慣例

- **単一プロジェクト**: ルートに `src/`, `tests/`
- **Webアプリ**: `backend/src/`, `frontend/src/`
- **モバイル**: `api/src/`, `ios/src/` または `android/src/`
- 下のパスは単一プロジェクトを想定しています — `plan.md` の構成に応じて調整してください

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## フェーズ1: セットアップ（共有インフラ）

**目的**: プロジェクト初期化と基本構成の整備

- [ ] T001 `plan.md` に従いプロジェクト構造を作成する
- [ ] T002 `package.json` 等を初期化し、[言語]/[フレームワーク] の依存関係を追加する
- [ ] T003 [P] リンティングとフォーマッターを設定する

---

## フェーズ2: 基盤（実装の前提）

**目的**: どのユーザーストーリーにも先立って完了している必要があるコアなインフラ

**⚠️ 重要**: このフェーズが完了するまでユーザーストーリーの実装を開始してはいけません。

下のタスクは例です（プロジェクトに合わせて調整してください）:

- [ ] T004 データベーススキーマとマイグレーション枠組みを設定する
- [ ] T005 [P] 認証／認可の仕組みを実装する
- [ ] T006 [P] API ルーティングとミドルウェア構造を設定する
- [ ] T007 全ストーリーが依存するベースモデル／エンティティを作成する
- [ ] T008 エラーハンドリングとロギング基盤を設定する
- [ ] T009 環境設定（env 管理）を設定する

**チェックポイント**: 基盤が整備されたら、ユーザーストーリーの実装を並列に開始できます

---

## フェーズ3: ユーザーストーリー1 - [タイトル] (優先度: P1) 🎯 MVP

**目標**: [このストーリーで提供する内容の簡潔な説明]

**独立テスト基準**: [このストーリーを単独で検証する方法]

### ユーザーストーリー1 のテスト（任意 — テストが要求されている場合のみ）⚠️

> **注意: これらのテストは先に書き、実装前に失敗することを確認してください**

- [ ] T010 [P] [US1] `tests/contract/test_[name].py` に [endpoint] の契約テストを作成
- [ ] T011 [P] [US1] `tests/integration/test_[name].py` にユーザージャーニーの統合テストを作成

### ユーザーストーリー1 の実装

- [ ] T012 [P] [US1] `src/models/[entity1].py` に [Entity1] モデルを作成
- [ ] T013 [P] [US1] `src/models/[entity2].py` に [Entity2] モデルを作成
- [ ] T014 [US1] `src/services/[service].py` に [Service] を実装（T012, T013 に依存）
- [ ] T015 [US1] `src/[location]/[file].py` に [エンドポイント/機能] を実装
- [ ] T016 [US1] バリデーションとエラーハンドリングを追加
- [ ] T017 [US1] ユーザーストーリー1 の操作に対するロギングを追加

**チェックポイント**: ここまでで、ユーザーストーリー1 は単独で動作・検証できる状態にします

---

## フェーズ4: ユーザーストーリー2 - [タイトル] (優先度: P2)

**目標**: [このストーリーで提供する内容の簡潔な説明]

**独立テスト基準**: [このストーリーを単独で検証する方法]

### ユーザーストーリー2 のテスト（任意 — テストが要求されている場合のみ）⚠️

- [ ] T018 [P] [US2] `tests/contract/test_[name].py` に [endpoint] の契約テストを作成
- [ ] T019 [P] [US2] `tests/integration/test_[name].py` に統合テストを作成

### ユーザーストーリー2 の実装

- [ ] T020 [P] [US2] `src/models/[entity].py` に [Entity] モデルを作成
- [ ] T021 [US2] `src/services/[service].py` に [Service] を実装
- [ ] T022 [US2] `src/[location]/[file].py` に [エンドポイント/機能] を実装
- [ ] T023 [US2] 必要に応じてユーザーストーリー1 のコンポーネントと統合

**チェックポイント**: ここまでで、ユーザーストーリー1 と 2 はそれぞれ独立して動作するはずです

---

## フェーズ5: ユーザーストーリー3 - [タイトル] (優先度: P3)

**目標**: [このストーリーで提供する内容の簡潔な説明]

**独立テスト基準**: [このストーリーを単独で検証する方法]

### ユーザーストーリー3 のテスト（任意 — テストが要求されている場合のみ）⚠️

- [ ] T024 [P] [US3] `tests/contract/test_[name].py` に [endpoint] の契約テストを作成
- [ ] T025 [P] [US3] `tests/integration/test_[name].py` に統合テストを作成

### ユーザーストーリー3 の実装

- [ ] T026 [P] [US3] `src/models/[entity].py` に [Entity] モデルを作成
- [ ] T027 [P] [US3] `src/services/[service].py` に [Service] を実装
- [ ] T028 [P] [US3] `src/[location]/[file].py` に [エンドポイント/機能] を実装

**チェックポイント**: ここまでで、すべてのユーザーストーリーは独立して動作するはずです

---

[Add more user story phases as needed, following the same pattern]

---

## 最終フェーズ: ポリッシュ & 横断的関心事

**目的**: 複数のユーザーストーリーに影響する改善作業

- [ ] TXXX ドキュメント更新（`docs/`）
- [ ] TXXX コードのクリーンアップとリファクタリング
- [ ] TXXX 全体的なパフォーマンス最適化
- [ ] TXXX [P] 追加のユニットテスト（要求があれば）を `tests/unit/` に追加
- [ ] TXXX セキュリティ強化
- [ ] TXXX `quickstart.md` の検証を行う

---

## 依存関係と実行順序

### フェーズ依存関係

- **セットアップ（フェーズ1）**: 依存なし — すぐ開始可能
- **基盤（フェーズ2）**: セットアップ完了に依存 — すべてのユーザーストーリーをブロックする
- **ユーザーストーリー（フェーズ3以降）**: 基盤（フェーズ2）の完了に依存
  - 基盤完了後、ユーザーストーリーは並列で進められる（人員がいる場合）
  - または優先度順に直列で進める（P1 → P2 → P3）
- **ポリッシュ（最終フェーズ）**: 全ての対象ユーザーストーリー完了に依存

---

### ユーザーストーリーの依存関係

- **ユーザーストーリー1 (P1)**: 基盤（フェーズ2）後に開始可能 — 他のストーリーへの依存なし
- **ユーザーストーリー2 (P2)**: 基盤（フェーズ2）後に開始可能 — US1 と統合する可能性はあるが独立してテスト可能であること
- **ユーザーストーリー3 (P3)**: 基盤（フェーズ2）後に開始可能 — US1/US2 と統合する可能性はあるが独立してテスト可能であること

---

### 各ユーザーストーリー内の順序

- テスト（含める場合）は実装より先に作成し、失敗することを確認すること
- モデル → サービス → エンドポイント の順で実装
- コア実装の後に統合作業
- ストーリー完了を確認してから次の優先度へ進むこと

---

### 並列実行の機会

- [P] とマークされたセットアップタスクは並列で実行可能
- フェーズ2 の [P] タスクは並列で実行可能
- 基盤完了後、チームの余力があればユーザーストーリーは並列で開始可能
- ストーリー内の [P] テストは並列で実行可能
- ストーリー内の [P] モデル作成は並列で実行可能
- 異なるユーザーストーリーを別メンバーが並列で担当可能

---

## 並列実行例: ユーザーストーリー1

```bash
# ユーザーストーリー1 の全テストをまとめて実行（テストが要求されている場合）:
echo "Run contract test: tests/contract/test_[name].py"
echo "Run integration test: tests/integration/test_[name].py"

# ユーザーストーリー1 の全モデル作成を並列で実行:
echo "Create model: src/models/[entity1].py"
echo "Create model: src/models/[entity2].py"
```

---

## 実装戦略

### MVP優先 (まずはユーザーストーリー1)

1. フェーズ1: セットアップを完了する
2. フェーズ2: 基盤を完了する（重要 — 全ストーリーをブロック）
3. フェーズ3: ユーザーストーリー1 を完了する
4. **停止して検証**: ユーザーストーリー1 を単独でテストする
5. 準備できていればデプロイ／デモを行う

### インクリメンタルな提供

1. セットアップ＋基盤を完了 → 基盤準備完了
2. ユーザーストーリー1 を追加 → 単独でテスト → デプロイ／デモ（MVP）
3. ユーザーストーリー2 を追加 → 単独でテスト → デプロイ／デモ
4. ユーザーストーリー3 を追加 → 単独でテスト → デプロイ／デモ
5. 各ストーリーは前のストーリーを壊さずに価値を追加する

### チームでの並列戦略

複数の開発者がいる場合:

1. チームでセットアップ＋基盤を共同で完了する
2. 基盤が完了したら:
   - 開発者A: ユーザーストーリー1
   - 開発者B: ユーザーストーリー2
   - 開発者C: ユーザーストーリー3
3. 各ストーリーは独立して完了・統合する

---

## 備考

- [P] タスク = 別ファイルで依存関係がないタスク
- [Story] ラベルはトレーサビリティのためにタスクを特定のユーザーストーリーに紐付けます
- 各ユーザーストーリーは独立して完了・テスト可能であるべきです
- テストは実装前に失敗することを確認してください
- 各タスクまたは論理的なまとまりごとにコミットしてください
- 各チェックポイントでストーリーを独立して検証してください
- 避けるべきこと: 曖昧なタスク、同一ファイルでの競合、独立性を壊す横断的な依存関係
