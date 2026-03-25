# 実装計画 (Implementation Plan): Search Results Review Start

**ブランチ (Branch)**: `002-review-search-results` | **日付 (Date)**: 2026-03-22 | **仕様 (Spec)**: `specs/002-review-search-results/spec.md`
**入力 (Input)**: `specs/002-review-search-results/spec.md` の機能仕様

## 概要 (Summary)

学習カード一覧の現在の検索条件から復習を始めたとき、開始対象が開始時点の検索結果とずれないように、review target set の定義と生成経路を明文化する。設計の中心は、フロントエンドが保持する `CardListFilter` を review start API に渡し、バックエンド側でその filter に一致するカードを安定順序で解決し、利用不能なカードを除外しながら最大 200 件までを review session として確定することにある。既存の Review ページ、session 永続化、snapshot 取得、自己評価、前後移動は再利用しつつ、開始時の対象集合を「スクロール済み DOM ではなく、現在の検索条件に一致する結果全体」として扱い、空結果・一部利用不能・200 件超過のいずれでも理由付きで安全に開始結果を説明できるようにする。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18+  
**フロントエンド (Frontend)**: React 18.3 + Vite 5 + React Router DOM 7.13  
**バックエンド (Backend)**: Express 4.19 + Zod 3.23  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6  
**CSS**: Tailwind CSS 3.4 + `theme.json` design tokens  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2 + Testing Library + Supertest + Playwright  
**テスト実施方法**: テストの実施手順・方式・ケース定義はリポジトリルートの `test.md` に従い、`npm run test` と `npm run test:e2e` を基本コマンドとする  
**対象プラットフォーム (Target Platform)**: Web SPA + JSON API  
**プロジェクト種別 (Project Type)**: backend / frontend 分離のモノレポ Web application  
**性能目標 (Performance Goals)**: 通常件数では review start が p95 500ms 以内に初回 snapshot を返し、200 件上限適用時でも Review 画面のカード移動はフルリロードなしで 100ms 未満の体感応答を維持する  
**制約 (Constraints)**: 既存の復習スケジューリングと自己評価ロジックは変更しないこと。復習対象は選択状態や現在スクロール済みの表示件数ではなく、開始時点の `CardListFilter` に一致するカード集合として決定すること。200 件上限は silent truncation ではなく明示的な仕様として扱い、除外件数と理由を snapshot で説明可能にすること。追加データは session、filter summary、target resolution notice の最小集合に留め、PII を増やさないこと  
**規模/スコープ (Scale/Scope)**: 一覧ページ 1 画面、復習ページ 1 画面、review start API 契約 1 系統、review session 永続化の再利用、backend/frontend/E2E テスト更新を含む中規模のフロー整合修正

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に通過し、Phase 1 の設計後に再チェックする。*

### Phase 0 Gate

- 正確性: PASS
  - 復習対象集合は開始時点の検索条件からサーバ側で決定し、選択状態やロード済み件数に依存させない。200 件超は明示的な上限適用として扱い、除外件数と理由を返す。
- 継続性・UX: PASS
  - 一覧で見つけた結果から 1 操作で復習開始し、Review 画面へ遷移後も同じ対象集合を 1 枚ずつ継続できる。
- プライバシーとデータ最小化: PASS
  - session に保存するのは `sourceQuery`、filter、sort、tag/collection label、対象 cardId 順序、target resolution notice の最小情報のみとし、新しい個人データは追加しない。
- 説明可能性: PASS
  - Review 画面の `filterSummary` に開始条件と exclusion metadata を表示し、「なぜこのカード群を復習しているか」「何件除外されたか」を追跡できる。
- 信頼性・セキュリティ: PASS
  - Zod による filter 検証、server-side の deterministic order、空結果 404、上限超過の明示、既存 review session snapshot の再利用、回帰テスト追加を前提とする。

### Post-Design Gate

- 正確性: PASS
  - review start は単純なページング用 `listCards(limit: 200)` を流用せず、検索条件から ordered target candidates を解決し、利用不能を除外しながら最初の 200 件を採用する専用 resolver を使う設計とする。
- 継続性・UX: PASS
  - `CardList.tsx` が保持する `CardListFilter` を single source of truth とし、Review 画面は snapshot 内の `filterSummary.targetResolution` を表示するだけで開始理由を説明できる。
- プライバシーとデータ最小化: PASS
  - 新規 contract は exclusion metadata を件数ベースで返し、除外カードの個別 ID や余分な属性は返さない。
- 説明可能性: PASS
  - data model と contract に「開始時点で固定された検索結果集合」「200 件上限」「除外理由の内訳」を明記し、filter summary に統合して継続表示できる。
- 信頼性・セキュリティ: PASS
  - backend で ordered target resolver と exclusion breakdown をテストし、frontend/E2E で検索結果との一致、空結果、上限超過の案内を検証する。

*ゲート結果 (Phase 0 / Phase 1 後): PASS。検索結果定義の明確化、開始時点 snapshot 固定、利用不能カードの除外、200 件上限の明示、除外理由の継続表示を必須条件として設計を進める。*

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/002-review-search-results/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### ソースコード (リポジトリルート / Source Code)

```text
backend/
├── contracts/
│   └── openapi.yaml
├── src/
│   ├── api/
│   │   └── review.ts
│   ├── repositories/
│   │   ├── cardRepository.ts
│   │   └── reviewSessionRepository.ts
│   ├── schemas/
│   │   └── review.ts
│   ├── services/
│   │   └── searchService.ts
│   └── domain/
│       ├── cardList.ts
│       └── review.ts
frontend/
├── src/
│   ├── pages/
│   │   ├── CardList.tsx
│   │   └── Review.tsx
│   ├── services/
│   │   └── api/
│   │       └── reviewApi.ts
│   ├── domain/
│   │   ├── cardList.ts
│   │   └── review.ts
│   ├── components/
│   │   └── uiParts/
│   │       └── ReviewProgressHeader.tsx
│   └── utils/
│       ├── reviewSessionStorage.ts
│       └── routes/
│           └── reviewSession.ts
tests/
├── backend/
│   └── review.test.ts
├── frontend/
│   ├── cardListStates.test.tsx
│   └── review.test.tsx
└── e2e/
    └── review-screen.spec.ts
```

**構造の決定 (Structure Decision)**: backend / frontend 分離構造を維持する。フロントエンドは `frontend/src/pages/CardList.tsx` を filter state の source of truth とし、review start 時はその `CardListFilter` を `frontend/src/services/api/reviewApi.ts` 経由で送る。バックエンドは `backend/src/api/review.ts` と `backend/src/schemas/review.ts` で request を検証し、`backend/src/repositories/cardRepository.ts` と `backend/src/services/searchService.ts` に「全候補件数の算出」「利用可能カードの安定順序解決」「200 件上限適用」「exclusion breakdown 生成」の責務を寄せる。review session の永続化、snapshot 生成、自己評価・前後移動は `backend/src/repositories/reviewSessionRepository.ts` を継続利用し、UI への説明情報は `backend/src/domain/review.ts` / `frontend/src/domain/review.ts` の `filterSummary.targetResolution` に集約する。

## 複雑性トラッキング (Complexity Tracking)

| 違反 (Violation) | 必要な理由 (Why Needed) | 単純案を採用しない理由 (Simpler Alternative Rejected Because) |
| --- | --- | --- |
| branch 名が `feature/...` ではなく `002-review-search-results` | 現在の speckit ワークフローと既存 feature directory が番号付き slug を前提に生成されているため | 今回だけ手動で branch / spec path を改名すると、既存 artifacts と自動スクリプトの参照先がずれて計画更新の一貫性を失うため |
