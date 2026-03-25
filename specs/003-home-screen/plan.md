# 実装計画 (Implementation Plan): ホーム画面 ASCII UI デザイン

**ブランチ (Branch)**: `003-home-screen` | **日付 (Date)**: 2026-03-25 | **仕様 (Spec)**: `C:\work\Forgetting_curve_ssd2\Forgetting_curve\specs\003-home-screen\spec.md`
**入力 (Input)**: `C:\work\Forgetting_curve_ssd2\Forgetting_curve\specs\003-home-screen\spec.md` の機能仕様

## 概要 (Summary)

ホーム画面を `/` に実装し、既存の `AppLayout` 配下で学習サマリ 4 指標、主要導線、最近のアクティビティ 3 件、状態別表示を提供する。技術的には、既存の cards/review API をクライアント側で合成せず、最小データで一貫した表示を返す専用 `GET /api/home` を追加し、フロントは `frontend/src/pages/Home.tsx` と関連 API クライアントを更新して既存の review start フローと遷移規約を再利用する。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18 系  
**フロントエンド (Frontend)**: React 18.3 + React Router DOM 6 + Vite 5  
**バックエンド (Backend)**: Express 4（`backend/src/index.ts` で API ルータを集約）  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6  
**CSS**: Tailwind CSS 3.4（`theme.json` のトークンを使用）  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2, Testing Library, Supertest, Playwright  
**テスト実施方法**: テストの実施手順・方式・ケース定義はリポジトリルートの `test.md` に従う。branch coverage と境界値テストを必須とする。  
**対象プラットフォーム (Target Platform)**: Web ブラウザ + Node.js API サーバ  
**プロジェクト種別 (Project Type)**: backend / frontend 分離の Web application  
**性能目標 (Performance Goals)**: ホーム初期表示は API 1 リクエストで完結し、ローカル検証で `GET /api/home` の p95 を 500ms 以内、主要導線はファーストビューまたは短い 1 スクロール以内で認識可能にする  
**制約 (Constraints)**: 既存 `AppLayout` とトップレベルナビゲーションを維持すること、ホーム payload にカード本文や回答を含めないこと、`復習を始める` は server-side で today フィルタ解決する既存 review start に接続すること  
**規模/スコープ (Scale/Scope)**: 1 画面、1 取得 API、4 指標、3 件の recent activities、4 状態（通常 / 初回利用 / 今日の復習なし / 取得失敗）

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に必ず通過すること。Phase 1 の設計後に再チェックすること。*

### Phase 0 Gate

- 正確性: PASS。today / overdue / unlearned の定義は `backend/src/services/searchService.ts` の既存フィルタ意味に合わせ、review start 対象の整合性を server-side 集計で維持する。
- 継続性・UX: PASS。ホームは `/` の単一画面で、復習開始・カード一覧・カード登録・設定の導線を既存トップレベル遷移へ最短接続する。
- プライバシーとデータ最小化: PASS。ホーム API は集計値と主要イベントのみ返し、カード本文・回答・詳細履歴は返さない。
- 説明可能性: PASS。4 指標を固定し、recent activity を主要イベントに限定することで、ユーザが次に取るべき行動を明確にする。
- 信頼性・セキュリティ: PASS。バックエンドは既存 Express + Prisma 構造に沿って追加し、失敗時は非 2xx と再試行導線で明示する。

### Phase 1 Re-check

- 正確性: PASS。`GET /api/home` 契約は cards と review_sessions のみを根拠に集計し、review start は既存 `POST /api/review/start` の `filter: today` を再利用する。
- 継続性・UX: PASS。`AppLayout` 配下の `Home` を差し替えるだけで既存ナビゲーションとパンくずを保持できる。
- プライバシーとデータ最小化: PASS。`recentActivities` は最大 3 件のイベント要約のみとし、不要な PII やカード内容を持ち出さない。
- 説明可能性: PASS。状態フラグ `firstUse` / `noReviewToday` と固定 4 指標により画面分岐を単純に保つ。
- 信頼性・セキュリティ: PASS。API 契約は 200 と 503 を明示し、フロントはエラー状態と再試行 CTA を持つ。

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/003-home-screen/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
├── checklists/
│   └── requirements.md
├── ascii_ui.txt
└── spec.md
```

### ソースコード (リポジトリルート / Source Code)

```text
backend/
├── src/
│   ├── index.ts
│   ├── api/
│   │   ├── review.ts
│   │   └── home.ts          # 新規想定
│   ├── repositories/
│   │   ├── cardRepository.ts
│   │   └── homeRepository.ts # 新規想定
│   ├── schemas/
│   │   └── home.ts          # 新規想定
│   └── services/
│       └── searchService.ts
├── contracts/
│   └── openapi.yaml
└── package.json

frontend/
├── src/
│   ├── App.tsx
│   ├── pages/
│   │   └── Home.tsx
│   ├── components/
│   │   └── uiParts/
│   │       └── AppLayout.tsx
│   ├── services/
│   │   └── api/
│   │       ├── reviewApi.ts
│   │       └── homeApi.ts   # 新規想定
│   ├── domain/
│   │   └── home.ts          # 新規想定
│   └── utils/
│       └── routes/
│           ├── reviewSession.ts
│           └── topLevelPages.ts
└── package.json

tests/
├── backend/
│   └── home.test.ts         # 新規想定
├── frontend/
│   └── home.test.tsx        # 新規想定
└── e2e/
    └── home-screen.spec.ts  # 任意
```

**構造の決定 (Structure Decision)**: backend / frontend 分離構成を維持し、バックエンドは `backend/src/index.ts` へ `homeRouter` を 1 本追加、フロントエンドは既存 `App.tsx` と `AppLayout.tsx` を変えず `frontend/src/pages/Home.tsx` と API クライアントを差し替える。状態分岐と DTO はそれぞれ `backend/src/schemas/home.ts`、`frontend/src/domain/home.ts` に閉じ込め、cards/review の既存責務を汚さない。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

該当なし。
