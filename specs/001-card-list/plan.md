# 実装計画 (Implementation Plan): 学習カード一覧 (001-card-list)

**ブランチ (Branch)**: `001-card-list` | **日付 (Date)**: 2026-03-21 | **仕様 (Spec)**: `specs/001-card-list/spec.md`
**入力 (Input)**: `specs/001-card-list/spec.md` の機能仕様

## 概要 (Summary)

既存のカード一覧実装を土台に、clarified spec に合わせて画面遷移基盤と契約を整理する。カード一覧そのものは現在の React + Express + Prisma 構成を維持し、検索、単一選択ステータスフィルタ、タグ/コレクション共用モーダル、ソート埋め込み、無限スクロール、復習開始、バルク操作の既存挙動を保持する。追加で React Router によるルート共通レイアウトを導入し、`/` をホーム、`/cards` を実カード一覧、`/review`、`/stats`、`/settings` をプレースホルダールートとして定義する。バックエンド契約は候補取得 API、カード一覧 API、バルク API、復習開始 API を整理し、バルクタグ操作の冪等性とアーカイブ後の一覧除外を設計上明文化する。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18+  
**フロントエンド (Frontend)**: React 18.3 + Vite 5 + React Router DOM 6 系を frontend workspace に追加して利用  
**バックエンド (Backend)**: Express 4 + Zod  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6 を継続利用  
**CSS**: Tailwind CSS 3.4。`theme.json` を Tailwind theme extension の参照元とする  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2 + Testing Library + Playwright + Supertest  
**テスト実施方法**: テストの実施手順・方式・ケース定義はリポジトリルートの `test.md` に従い、`npm run test` と `npm run test:e2e` を基本コマンドとする  
**対象プラットフォーム (Target Platform)**: Web SPA + JSON API  
**プロジェクト種別 (Project Type)**: backend / frontend 分離のモノレポ Web application  
**性能目標 (Performance Goals)**: SC-002 に従い、初回表示で 2 秒以内に表示開始を認識できること。候補モーダル検索は短い入力ディレイで体感待ち時間を抑えること  
**制約 (Constraints)**: 既存の検索、フィルタ、ソート、無限スクロール、選択、バルク操作、削除確認、復習開始の挙動を変えないこと。`ascii_ui.txt` と `theme.json` を優先し、直書き CSS を避けること。復習スケジューリングの計算ロジックは変更しないこと  
**規模/スコープ (Scale/Scope)**: 5 つのトップレベルルート、1 つの実データ連携ページ、2 種のモーダルフロー、4 系統の API 群、既存回帰テストの更新を含む中規模 UI/契約改修

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に通過済み。Phase 1 の設計後に再チェック済み。*

- 正確性: 復習開始は常に現在の絞り込み結果を対象とし、選択状態は影響させない。スケジューリングや採点ロジックは変更しない。
- 継続性・UX: 検索、フィルタ、バルク操作、復習開始を 1 画面で完結させ、条件変更時は選択をクリアして誤操作を防ぐ。トップレベルルート追加後も共通ヘッダー配下で本文のみ切り替える。
- プライバシーとデータ最小化: タグ/コレクション候補 API は `id`、`label`、`matchedBy` の最小情報のみ返す。プレースホルダールートでは追加の学習データを扱わない。
- 説明可能性: ステータス、ソート、選択済みフィルタ、削除対象一覧を UI 上で明示し、破壊的操作は確認モーダルで説明する。
- 信頼性・セキュリティ: Zod による入力検証、カーソル整合性検証、冪等なタグ一括操作、回帰テスト追加を前提とする。PII を含むログ追加は行わない。

*ゲート結果 (Phase 0 / Phase 1 後): PASS。候補 API の最小返却、選択クリア、タグ一括操作の冪等性、復習開始の filter 基準維持、テスト更新を必須条件として設計を進める。*

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/001-card-list/
├── ascii_ui.txt
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
│   ├── services/
│   └── utils/

frontend/
├── src/
│   ├── components/
│   │   ├── uiParts/
│   │   └── uniqueParts/
│   ├── domain/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   │   └── api/
│   ├── styles/
│   └── utils/
│       └── theme/
├── stories/
└── storybook-static/
```

**構造の決定 (Structure Decision)**: backend / frontend の分離構造を維持する。バックエンドは `backend/src/api` と `backend/src/routes` に HTTP エントリポイント、`backend/src/schemas` に Zod バリデーション、`backend/src/repositories` に Prisma ベースの一覧・バルク更新処理を集約する。フロントエンドは `frontend/src/pages` をルート単位の統合層とし、`frontend/src/pages/CardList.tsx` をカード一覧のオーケストレーションの中心に据えたまま、`frontend/src/App.tsx` で React Router と共通レイアウトを導入する。汎用モーダルや非同期状態は `frontend/src/components/uiParts`、一覧固有のフィルタ・カード行・削除確認は `frontend/src/components/uniqueParts` に置く。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

現時点で追加の正当化が必要な憲法違反はない。
