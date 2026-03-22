# 実装計画 (Implementation Plan): Review Screen

**ブランチ (Branch)**: `[001-review-screen]` | **日付 (Date)**: 2026-03-22 | **仕様 (Spec)**: [spec.md](./spec.md)
**入力 (Input)**: [spec.md](./spec.md) の機能仕様

## 概要 (Summary)

復習画面を、カード一覧から開始した review session を 1 枚ずつ確実に消化できる実画面へ置き換える。設計の中心は、進行中セッションの永続化、現在カードのスナップショット取得、回答表示前の評価禁止、評価後の明示遷移、離脱後の同一セッション再開である。加えて、各カードが今回の復習対象になった根拠を補助情報として簡潔に提示し、一時的な通信失敗時でも最後に取得した snapshot と未同期の現在カード評価をローカル保持して復旧できるようにする。既存の TypeScript モノレポ、React Router 7、Express 4、Prisma 5、Zod 3 を維持しつつ、サーバ側に review session モデルと snapshot API を追加し、フロントは Review ページと API クライアントを中心に画面状態を再構築する。

## 技術コンテキスト (Technical Context)

**Language/Version**: TypeScript 5.5 / Node.js 18+  
**Primary Dependencies**: React 18, React Router DOM 7, Express 4, Prisma 5, Zod 3, Tailwind CSS 3, Storybook 8, Vitest, Playwright  
**Frontend**: React 18 + Vite 5 + React Router DOM 7  
**Backend**: Node.js + Express 4 + Zod 3  
**Storybook**: Storybook 8  
**CSS**: Tailwind CSS 3 + theme.json design tokens  
**ORM**: Prisma 5  
**Storage**: PostgreSQL via Prisma 5  
**Testing**: Vitest, Testing Library, Supertest, Playwright  
**テスト実施方法**: テストの実施手順・方式・ケース定義はリポジトリルートの test.md に記載します。  
**Target Platform**: Web browser + Node.js server  
**Project Type**: Web application monorepo (frontend/backend split)  
**Performance Goals**: review start / resume snapshot API は p95 300ms 未満、カード移動はフルリロードなしで 100ms 未満の体感応答、モバイル表示でも主要操作が 1 画面内で完結する  
**Constraints**: 既存 /api/review/start の責務を壊さず拡張すること、自己評価は次カード遷移前のみ上書き可能で遷移後は固定すること、進行中 session は離脱後に再開できること、復習理由は既存の card/session 情報から構成して追加の個人データを収集しないこと、一時的な通信失敗時は最後に取得した snapshot と未同期の現在カード評価をローカル保持して再試行可能にすること、収集データは session と評価の最小集合に留めること  
**Scale/Scope**: 1 つの review screen、review session 永続化用 DB モデル 2 つ、review API 拡張 4 エンドポイント前後、frontend 1 ページ + API/型 + テスト追加

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に必ず通過すること。Phase 1 の設計後に再チェックすること。*

### Phase 0 Gate

- 正確性: PASS
  - assessment-before-next、assessment lock after advance、resume same session をサーバ側の永続化と契約で保証する方針を採用する
- 継続性・UX: PASS
  - 離脱後の再開、PC/モバイル両対応、回答表示前の評価禁止、キーボードショートカット、一時通信失敗時のローカル保持と再試行を設計対象に含める
- プライバシーとデータ最小化: PASS
  - 永続化するのは session id、card id、order、評価値、現在位置、開始条件要約のみとし、PII は追加しない。復習理由は既存の次回復習予定や filter summary から組み立て、追加の個人データは収集しない
- 説明可能性: PASS
  - 進捗、残件数、開始条件要約、評価別完了サマリに加え、「なぜ今このカードを復習するのか」を示す review reason を snapshot に含めて UI へ表示する
- 信頼性・セキュリティ: PASS
  - Zod 入力検証、404/409 エラー、再読み込み導線、ローカル保持した未同期評価の再送、既存テスト基盤での自動テスト追加を前提にする

### Post-Design Gate

- 正確性: PASS
  - ReviewSession / ReviewSessionCard で順序、現在位置、評価固定条件を表現するため、業務ルールをサーバ側で一貫して判定できる
- 継続性・UX: PASS
  - URL の sessionId とクライアント保存キーで復帰先を特定し、GET snapshot で同一 session を復元できる設計になっている。通信失敗時も最後に成功した snapshot を表示しつつ再試行できる
- プライバシーとデータ最小化: PASS
  - 追加 API は review に必要な最小レスポンスのみを返し、集計や filter summary、review reason も review 文脈に限定する
- 説明可能性: PASS
  - snapshot contract に progress、remainingCount、summary、currentAssessment、filter summary、review reason を含める
- 信頼性・セキュリティ: PASS
  - エラー系 contract、Prisma migration、ローカル snapshot/未同期評価の保持と再送、Supertest と RTL/E2E の追加で DoD を満たせる計画になっている

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/001-review-screen/
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
│   ├── domain/
│   │   └── review.ts
│   └── routes/
│       └── review.ts
frontend/
├── src/
│   ├── pages/
│   │   └── Review.tsx
│   ├── services/
│   │   └── api/
│   │       └── reviewApi.ts
│   ├── domain/
│   │   └── review.ts
│   ├── components/
│   │   ├── uiParts/
│   │   └── uniqueParts/
│   └── utils/
tests/
├── backend/
│   └── review.test.ts
├── frontend/
│   └── review.test.tsx
└── e2e/
    └── review-screen.spec.ts
prisma/
└── schema.prisma
```

**構造の決定 (Structure Decision)**: backend/frontend 分離を維持し、review session の永続化は backend の repository + schema + domain へ追加する。snapshot には progress や filter summary に加えて review reason を含め、理由表示は既存の次回復習予定や開始条件から構成する。frontend は Review.tsx を画面オーケストレーションの中心にし、API 呼び出しは frontend/src/services/api/reviewApi.ts、型は frontend/src/domain/review.ts に分離する。通信失敗時は frontend/src/utils/reviewSessionStorage.ts に最後に成功した snapshot と未同期の現在カード評価を保持し、復旧後に同一 session へ再送する。Storybook は既存 UI 部品の再利用範囲に留め、本 feature では画面統合を優先する。

## 複雑性トラッキング (Complexity Tracking)

現時点で憲法違反に当たる設計はない。追加する複雑性は、session を正確に再開し評価を固定するために必要な最小限の永続化と API 拡張に限定する。
