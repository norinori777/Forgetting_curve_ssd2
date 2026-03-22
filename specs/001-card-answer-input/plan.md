# 実装計画 (Implementation Plan): 学習カード登録の回答入力項目 (001-card-answer-input)

**ブランチ (Branch)**: `001-card-answer-input` | **日付 (Date)**: 2026-03-22 | **仕様 (Spec)**: `specs/001-card-answer-input/spec.md`
**入力 (Input)**: `specs/001-card-answer-input/spec.md` の機能仕様

## 概要 (Summary)

既存の学習カード登録フローに、任意の複数行回答を入力する欄を追加する。main 時点では回答の永続化経路がまだ存在しないため、本 feature では登録画面 UI だけでなく、Prisma schema、create API の request/response、frontend の draft/preview、docs/messages の更新までを 1 つの変更として扱う。未入力または空白のみの回答は未登録として正規化し、登録前プレビューでは回答全文を表示する。既存の title / content / tag / collection の導線、登録失敗時の再試行、一覧復帰の成功体験は維持する。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18+  
**フロントエンド (Frontend)**: React 18.3 + Vite 5 + React Router DOM 7.13  
**バックエンド (Backend)**: Express 4 + Zod 3  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6  
**CSS**: Tailwind CSS 3.4  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2 + Testing Library + Supertest + Playwright  
**Primary Dependencies**: React 18, React Router DOM 7, Express 4, Prisma 5, Zod 3, Tailwind CSS 3, Storybook 8  
**テスト実施方法**: テストの実施手順・方式・ケース定義はリポジトリルートの `test.md` に従い、`npm run test` と `npm run test:e2e` を基本コマンドとする  
**対象プラットフォーム (Target Platform)**: Web SPA + JSON API  
**プロジェクト種別 (Project Type)**: backend / frontend 分離のモノレポ Web application  
**性能目標 (Performance Goals)**: 登録画面の入力・プレビュー更新は同期的に反映され、登録送信後は成功/失敗を即座に提示する。回答欄追加によって既存の登録体験や一覧復帰の体感を劣化させない  
**制約 (Constraints)**: 回答は任意項目であり、未入力または空白のみは未登録として扱う。登録前プレビューでは回答全文を表示する。既存のタグ free-form 入力、コレクション選択、登録成功後の一覧復帰、失敗時の draft 保持は維持する。ローカル開発 DB 同期は現行 repo 運用に合わせて `prisma db push` を前提とする  
**規模/スコープ (Scale/Scope)**: 1 つの登録画面拡張、1 つの create API 契約拡張、1 つの Prisma schema 変更、draft/preview/message/test 更新を含む中規模 feature

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に通過済み。Phase 1 の設計後に再チェックすること。*

- 正確性: 回答欄追加は登録データの保存と表示に限定し、復習スケジューリングや採点ロジックは変更しない。create API は title / content の必須判定を維持しつつ、answer の正規化ルールを明示する。
- 継続性・UX: 既存の登録フローを壊さず、回答欄は任意項目として自然に追加する。登録前プレビュー全文表示により、複数行回答でも登録前確認を容易にする。
- プライバシーとデータ最小化: 追加保存するのは card の optional answer のみ。ログや flash message に回答本文を出力しない。
- 説明可能性: 回答が任意であること、未入力/空白のみは未登録になること、プレビューで全文確認できることを UI と spec で明示する。
- 信頼性・セキュリティ: Zod 検証、answer 正規化、Prisma 永続化、frontend draft 保持、unit/integration/E2E テスト追加を前提とする。main に answer 列が存在しないため、schema と API 契約を同 feature で一貫更新する。

*ゲート結果 (Phase 0 / Phase 1 後): PASS。回答の正規化、永続化追加、UI 全文プレビュー、ドラフト保持、回帰テスト追加を必須条件として進める。*

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/001-card-answer-input/
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
├── src/
│   ├── api/
│   ├── db/
│   ├── domain/
│   ├── repositories/
│   ├── routes/
│   ├── schemas/
│   └── services/

frontend/
├── src/
│   ├── components/
│   │   ├── uiParts/
│   │   └── uniqueParts/
│   ├── domain/
│   ├── pages/
│   ├── services/
│   │   └── api/
│   └── utils/
├── stories/

prisma/
└── schema.prisma

docs/
└── messages.md

tests/
├── backend/
├── frontend/
└── e2e/
```

**構造の決定 (Structure Decision)**: 既存の backend / frontend 分離構造を維持する。バックエンドは `backend/src/schemas/cards.ts` の create schema、`backend/src/api/cards.ts` の POST `/api/cards`、`backend/src/repositories/cardRepository.ts` の永続化マッピング、`backend/src/domain/cardList.ts` の返却型を拡張する。フロントエンドは `frontend/src/domain/cardCreate.ts` を draft と request/response の正本とし、`frontend/src/pages/CardCreate.tsx` が状態管理、`frontend/src/components/uniqueParts/CardCreateForm.tsx` と `CardCreatePreview.tsx` が表示を担う。DB 変更は `prisma/schema.prisma` に集約し、文言差分は `docs/messages.md` に追加する。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

現時点で追加の正当化が必要な憲法違反はない。

