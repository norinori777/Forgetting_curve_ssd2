 # tasks.md

## フェーズ1: セットアップ
- [x] T001 [P] Create project skeleton directories: `backend/`, `frontend/`, `tests/e2e/`
- [x] T002 [P] Add root and workspace package files: `backend/package.json`, `frontend/package.json`, `package.json`
- [x] T003 [P] Add TypeScript and build configs: `tsconfig.json` (root), `backend/tsconfig.json`, `frontend/tsconfig.json`
- [x] T004 [P] Add linting & formatting configs: `.eslintrc.js`, `.prettierrc`
- [x] T005 [P] Add basic CI workflow stub: `.github/workflows/ci.yml`
- [x] T006 Create DB config and migration scaffold: `prisma/schema.prisma` (or `db/migrations/`)
- [x] T007 [P] Add testing setup files: `jest.config.js` or `vitest.config.ts`, `playwright.config.ts`

## フェーズ2: 基盤（ブロッキング前提）
- [x] T008 Implement DB schema per data-model: `prisma/schema.prisma` -> tables `cards`, `tags`, `collections`, `card_tags`
- [x] T009 [P] Add API contract to backend: move/copy `specs/001-card-list/contracts/openapi.yaml` -> `backend/contracts/openapi.yaml`
- [x] T010 Implement card listing API with cursor pagination and filters: `backend/src/routes/cards.ts`
- [x] T011 Implement bulk operations API (`archive`, `delete`, `addTags`, `removeTags`): `backend/src/routes/bulk.ts`
- [x] T012 Implement review start API endpoint (`/api/review/start`): `backend/src/routes/review.ts`
- [x] T013 Implement DB access layer / repository for cards (cursor-based queries): `backend/src/repositories/cardRepository.ts`
- [x] T014 [P] Implement OpenAPI-driven request/response validation or DTOs: `backend/src/schemas/*` (JSON Schema / Zod / TypeBox)
- [x] T015 Implement backend tests for pagination, filtering, and bulk delete: `tests/backend/cards.test.ts`

## フェーズ3: ユーザーストーリー1 — 今日の復習から開始 (優先度: P1)
- [x] T016 [US1] Implement "今日の復習" filter UI and state: `frontend/src/components/filters/TodayFilter.tsx`
- [x] T017 [US1] Implement card list page shell and item components: `frontend/src/pages/CardList.tsx`, `frontend/src/components/CardItem.tsx`
- [x] T018 [US1] Implement "復習開始" action that invokes `POST /api/review/start` using current filters: `frontend/src/components/StartReviewButton.tsx`
- [x] T019 [US1] Add E2E test for US1: ensure "今日の復習" → "復習開始" starts session with displayed cards: `tests/e2e/us1.spec.ts`

## フェーズ4: ユーザーストーリー2 — 検索/絞り込み (優先度: P2)
- [x] T020 [P] [US2] Implement search input and debounce logic: `frontend/src/components/SearchBar.tsx`
- [x] T021 [P] [US2] Implement tag filter / collection selector UI: `frontend/src/components/TagFilter.tsx`, `frontend/src/components/CollectionSelector.tsx`
- [x] T022 [US2] Implement server-side search and tag-filter handling (full-text index, tags param): `backend/src/services/searchService.ts`
- [x] T023 [US2] Add integration / E2E tests for search, tag filter and sort: `tests/e2e/us2.spec.ts`

## フェーズ5: ユーザーストーリー3 — バルク操作 (優先度: P3)
- [x] T024 [US3] Implement multi-select UI and selection state (keyboard accessible): `frontend/src/components/SelectionBar.tsx`, `frontend/src/hooks/useSelection.ts`
- [x] T025 [US3] Implement bulk archive flow (client + backend call to `/api/cards/bulk`): `frontend/src/services/bulkService.ts`, `backend/src/routes/bulk.ts`
- [x] T026 [US3] Implement delete confirmation modal component (shows selected items, confirm/cancel, Esc handling): `frontend/src/components/DeleteConfirmModal.tsx`
- [x] T027 [US3] Wire bulk delete flow: open modal -> confirm -> call bulk delete -> refresh list: `frontend/src/pages/CardList.tsx`
- [x] T028 [P] [US3] Add unit and E2E tests for bulk operations including delete modal and irreversibility verification: `tests/e2e/us3.spec.ts`, `tests/frontend/deleteModal.test.ts`

## フェーズ6: 仕上げと横断対応
- [x] T029 [P] Add Storybook stories for `CardItem`, `SelectionBar`, `DeleteConfirmModal`, `StartReviewButton`: `frontend/.storybook/*`, `frontend/src/stories/*`
- [x] T030 Update API docs from `backend/contracts/openapi.yaml` and publish to `docs/api/card-list.md`
- [x] T031 Implement accessibility checks and keyboard-only flows audit: `frontend/accessibility-audit.md`
- [x] T032 Add performance test & tune initial render for SC-002: `tests/perf/initialRender.test.tsx`
- [x] T033 Update `specs/001-card-list/quickstart.md` with exact setup commands and run steps: `specs/001-card-list/quickstart.md`

## 依存関係
- Story completion order: Phase 1 -> Phase 2 -> Phase 3 (US1) -> Phase 4 (US2) -> Phase 5 (US3) -> Phase 6 (Polish)
- Backend APIs (T010/T011/T012/T013) are blocking for frontend interactive tasks that call them (T017/T018/T022/T025/T027)
- DB schema (T008) must be applied before backend repo/queries (T013)

## 並列実行例
- Parallel group A (independent): T001, T002, T003, T004, T005 can be run in parallel to prepare the dev environment
- Parallel group B (independent): T009 (API contract move), T014 (validation layer), T014 and T013 can be done in parallel with API route skeletons
- Per-story parallelism: UI components for a story (e.g., `SearchBar`, `TagFilter`) marked [P] can be implemented in parallel with backend service implementation if contracts are stable

## 独立テスト基準（ユーザーストーリー別）
- US1 (P1): Show "今日の復習" -> press "復習開始" -> review session starts with displayed cards only. (E2E test: `tests/e2e/us1.spec.ts`)
- US2 (P2): Keyword search and tag filter applied individually produce expected list changes. (Integration/E2E: `tests/e2e/us2.spec.ts`)
- US3 (P3): Multi-select -> bulk archive/delete -> only selected cards updated or removed; delete must show modal and be irreversible. (E2E: `tests/e2e/us3.spec.ts`)

## 実装戦略
- MVP: Deliver US1 only (Phase 1 + Phase 2 + Phase 3) to meet the highest value loop (find today's cards -> start review).
- Iterative delivery: Implement foundational backend APIs and DB schema first (T008, T010-T013), then basic frontend list and StartReview (T017-T018), then expand search and bulk ops.
- Testing: Add focused E2E for US1 first, then expand test coverage for US2/US3.

## 生成物
- `specs/001-card-list/research.md`
- `specs/001-card-list/data-model.md`
- `specs/001-card-list/contracts/openapi.yaml`
- `specs/001-card-list/quickstart.md`

## 生成タスク数
- Total tasks: 33
- Tasks per story: US1=3, US2=4, US3=5

## MVP 推奨範囲
- Implement up to and including `Phase 3: User Story 1` (T001-T018) as MVP.

*** End of tasks.md
