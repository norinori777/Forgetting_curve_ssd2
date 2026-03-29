# タスク: 共通ヘッダー簡素化

**入力**: `specs/001-shrink-header-menu/` 配下の設計ドキュメント  
**前提条件**: `plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/header-navigation.md`

**テスト**: `plan.md` のテスト方針と `test.md` の最低要件に従い、shared layout の自動テストとトップレベル導線の回帰確認を含める。

**構成**: タスクはユーザーストーリーごとに分け、各ストーリーを独立して実装・検証できるようにする。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 共通ヘッダー簡素化の検証基盤と実装先ファイルの作業面を揃える

- [X] T001 Create shared header regression scaffold in `tests/frontend/appLayout.test.tsx`
- [X] T002 [P] Extend top-level navigation smoke scaffold in `tests/e2e/home-screen.spec.ts`
- [X] T003 [P] Add compact-header render baseline in `tests/perf/initialRender.test.tsx`

**Checkpoint**: shared layout の回帰確認に必要な frontend / e2e / perf の受け皿が揃う

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーに共通する route metadata と shared layout の責務を整理する

**⚠️ CRITICAL**: このフェーズ完了前にユーザーストーリー作業を始めない

- [X] T004 Refactor top-level route metadata to separate brand-home navigation from menu items in `frontend/src/utils/routes/topLevelPages.ts`
- [X] T005 Refactor the fixed shared shell for brand-link navigation and compact spacing in `frontend/src/components/uiParts/AppLayout.tsx`
- [X] T006 [P] Align app-shell rendering and navigation test harness usage in `frontend/src/App.tsx`, `tests/frontend/home.test.tsx`, and `tests/frontend/stats.test.tsx`

**Checkpoint**: ホーム導線の責務と compact header の shared shell が定まり、各ストーリーを独立実装できる

---

## Phase 3: User Story 1 - 本文をより広く表示する (Priority: P1) 🎯 MVP

**Goal**: breadcrumb を廃止して固定ヘッダーの高さを縮め、トップレベルページで本文の見える範囲を増やす

**Independent Test**: 任意のトップレベルページを開いたとき、breadcrumb 専用領域がなく、compact header の直下に従来より多くの本文または主要操作が見えること

### Tests for User Story 1

- [X] T007 [P] [US1] Add no-breadcrumb and compact-header render coverage in `tests/frontend/appLayout.test.tsx`
- [X] T008 [P] [US1] Add initial-visible-content regression coverage in `tests/perf/initialRender.test.tsx`

### Implementation for User Story 1

- [X] T009 [US1] Remove breadcrumb markup and desktop header spacing from `frontend/src/components/uiParts/AppLayout.tsx`
- [X] T010 [US1] Rebalance fixed-header content offset for the compact shell in `frontend/src/components/uiParts/AppLayout.tsx`

**Checkpoint**: User Story 1 を単独で実行し、compact header による本文表示領域の改善を確認できる

---

## Phase 4: User Story 2 - パンくずがなくても迷わず移動する (Priority: P2)

**Goal**: ホームリンクをメニューから外してブランド領域へ統一しつつ、ホーム以外のトップレベル遷移を維持する

**Independent Test**: 任意のトップレベルページでメニューに `ホーム` が表示されず、ブランド領域から `/` に戻れ、ホーム以外の遷移と current context の認識が維持されること

### Tests for User Story 2

- [X] T011 [P] [US2] Add brand-home-link navigation coverage in `tests/frontend/appLayout.test.tsx` and `tests/frontend/home.test.tsx`
- [X] T012 [P] [US2] Add cross-route navigation regression in `tests/e2e/home-screen.spec.ts` and `tests/frontend/stats.test.tsx`

### Implementation for User Story 2

- [X] T013 [US2] Remove the home menu item while preserving route label resolution in `frontend/src/utils/routes/topLevelPages.ts`
- [X] T014 [US2] Implement clickable brand icon and service-name home navigation with active menu states in `frontend/src/components/uiParts/AppLayout.tsx`

**Checkpoint**: User Story 2 を単独で実行し、パンくずなしでもホーム復帰とトップレベル移動を確認できる

---

## Phase 5: User Story 3 - 小さい画面でも圧迫感を減らす (Priority: P3)

**Goal**: モバイル幅でも compact header が過剰に縦方向を占有せず、ブランド領域とメニューの到達性を保つ

**Independent Test**: モバイル幅で任意のトップレベルページを開いたとき、header が compact に保たれ、wrapped menu とブランド領域の両方で移動でき、本文先頭が隠れないこと

### Tests for User Story 3

- [X] T015 [P] [US3] Add mobile compact-header wrapping coverage in `tests/frontend/appLayout.test.tsx`
- [X] T016 [P] [US3] Add mobile navigation smoke coverage in `tests/e2e/home-screen.spec.ts`

### Implementation for User Story 3

- [X] T017 [US3] Tune mobile-first header spacing, menu wrapping, and brand hit area in `frontend/src/components/uiParts/AppLayout.tsx`
- [X] T018 [US3] Validate compact header behavior against top-level page shells in `frontend/src/pages/Home.tsx`, `frontend/src/pages/CardCreate.tsx`, `frontend/src/pages/Stats.tsx`, and `frontend/src/pages/Settings.tsx`

**Checkpoint**: User Story 3 を単独で実行し、モバイル幅での圧迫感軽減と導線維持を確認できる

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ドキュメント、アクセシビリティ、最終検証を整える

- [X] T019 [P] Sync compact-header verification steps and UI contract details in `specs/001-shrink-header-menu/quickstart.md` and `specs/001-shrink-header-menu/contracts/header-navigation.md`
- [X] T020 [P] Update accessibility and synthetic render verification notes in `frontend/accessibility-audit.md` and `tests/perf/initialRender.test.tsx`
- [X] T021 Run lint, unit, perf, and E2E validation via `package.json`, `frontend/package.json`, `tests/frontend/appLayout.test.tsx`, `tests/frontend/home.test.tsx`, `tests/frontend/stats.test.tsx`, `tests/e2e/home-screen.spec.ts`, and `tests/perf/initialRender.test.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。すぐ開始できる
- **Foundational (Phase 2)**: Phase 1 完了後に開始し、すべてのユーザーストーリーをブロックする
- **User Story 1 (Phase 3)**: Phase 2 完了後に開始できる。MVP の最小範囲
- **User Story 2 (Phase 4)**: Phase 2 完了後に開始できる。US1 と独立に検証できる
- **User Story 3 (Phase 5)**: Phase 2 完了後に開始できる。US1・US2 の上に段階的に積み上げられる
- **Polish (Phase 6)**: 実装対象のユーザーストーリー完了後に開始する

### User Story Dependencies

- **User Story 1 (P1)**: Foundational のみ依存。compact header による本文可視域改善の MVP
- **User Story 2 (P2)**: Foundational のみ依存。ブランド領域ホーム導線とメニュー整理を独立検証できる
- **User Story 3 (P3)**: Foundational のみ依存。モバイル幅の wrap と spacing を独立検証できる

### Within Each User Story

- テストタスクを先に作成し、失敗を確認してから本実装へ進む
- route metadata と shared layout の変更を先に行い、その後テストと個別ページの整合確認へ進む
- 1 ストーリーが独立して通る状態を作ってから次の優先度へ進む

---

## Parallel Examples

### User Story 1

```bash
Task: T007 Add no-breadcrumb and compact-header render coverage in tests/frontend/appLayout.test.tsx
Task: T008 Add initial-visible-content regression coverage in tests/perf/initialRender.test.tsx
```

### User Story 2

```bash
Task: T011 Add brand-home-link navigation coverage in tests/frontend/appLayout.test.tsx and tests/frontend/home.test.tsx
Task: T012 Add cross-route navigation regression in tests/e2e/home-screen.spec.ts and tests/frontend/stats.test.tsx
```

### User Story 3

```bash
Task: T015 Add mobile compact-header wrapping coverage in tests/frontend/appLayout.test.tsx
Task: T016 Add mobile navigation smoke coverage in tests/e2e/home-screen.spec.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 を完了して compact header の回帰確認用テスト受け皿を作る
2. Phase 2 を完了して brand home link と shared shell の責務を整理する
3. Phase 3 を完了して breadcrumb 削除と本文可視域改善を成立させる
4. User Story 1 を単独検証し、MVP として成立することを確認する

### Incremental Delivery

1. User Story 2 でブランド領域ホーム導線とトップレベルメニュー整理を完成させる
2. User Story 3 でモバイル幅の wrap、spacing、到達性を完成させる
3. 最後に quickstart、アクセシビリティ、lint、unit、perf、E2E をまとめて整える