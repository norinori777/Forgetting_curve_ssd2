# 実装計画 (Implementation Plan): カード回答項目 (001-card-answer-field)

**ブランチ (Branch)**: `001-card-answer-field` | **日付 (Date)**: 2026-03-22 | **仕様 (Spec)**: `specs/001-card-answer-field/spec.md`
**入力 (Input)**: `specs/001-card-answer-field/spec.md` の機能仕様

## 概要 (Summary)

既存のカード一覧機能を拡張し、カードが任意の回答テキストを持てるようにする。今回の範囲では回答登録 UI は追加せず、データモデル、一覧 API、一覧検索、カード行表示、回答表示設定の参照に集中する。技術方針としては、既存の React + Express + Prisma + PostgreSQL 構成を維持し、`Card` に nullable な `answer` を追加、`/api/cards` のレスポンスと検索条件に `answer` を含める。表示設定は既存の設定基盤が存在しないため、将来の設定画面と接続しやすい read-only のクライアント設定サービスを導入し、未設定時は `link` を安全な既定値とする。UI 状態は `CardList.tsx` でカード単位の表示状態を管理し、`CardItem.tsx` は presentational component のまま回答リンク表示と省略表示を担う。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18+  
**フロントエンド (Frontend)**: React 18.3 + Vite 5 + React Router DOM 7  
**バックエンド (Backend)**: Express 4 + Zod  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6  
**CSS**: Tailwind CSS 3.4  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2 + Testing Library + Supertest + Playwright  
**テスト実施方法**: テストの実施手順・方式・ケース定義はリポジトリルートの `test.md` に従い、`npm run test` と `npm run test:e2e` を基本コマンドとする  
**対象プラットフォーム (Target Platform)**: Web SPA + JSON API  
**プロジェクト種別 (Project Type)**: backend / frontend 分離のモノレポ Web application  
**Primary Dependencies**: React 18, React Router DOM 7, Express 4, Prisma 5, Zod 3, Tailwind CSS 3, Storybook 8  
**性能目標 (Performance Goals)**: 50 件単位の一覧取得で既存の無限スクロール体験を劣化させず、回答表示リンクの切替は追加ネットワークなしで即時反映する。回答を含む一覧検索は既存タイトル/本文検索と同等の体感速度を維持する  
**制約 (Constraints)**: 回答登録 UI と設定画面 UI は追加しない。`/api/cards` の既存カーソルページング、検索・フィルタ・ソート・選択・復習開始の挙動を変更しない。未設定や不正な設定値では `link` 表示へ安全にフォールバックする。一覧の長文回答は最大数行までに制限し、表示状態はカード単位で独立させる  
**規模/スコープ (Scale/Scope)**: 1 つの Prisma schema 変更、1 つの一覧 API 契約拡張、1 つのクライアント設定参照サービス追加、1 画面の表示拡張、関連する型・Storybook・API/UI テスト更新を含む中規模改修

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に通過済み。Phase 1 の設計後に再チェック済み。*

- 正確性: 復習スケジューリングや採点ロジックは変更しない。回答は表示と検索対象にのみ追加し、復習開始対象や間隔反復計算へ影響させない。
- 継続性・UX: 一覧の視認性を守るため、回答は設定値に応じてリンク表示または省略付き本文表示とし、カード単位で必要なときだけ展開する。既存の検索、絞り込み、復習開始フローを崩さない。
- プライバシーとデータ最小化: 新たに保持する設定値は回答表示モード 1 項目のみとし、クライアントローカルで扱う。追加ログに回答本文や個人情報を出力しない。
- 説明可能性: 回答が未登録であること、回答がリンク表示なのか本文表示なのかを UI 上で明示し、設定値取得失敗時は安全な既定表示へ倒す。
- 信頼性・セキュリティ: Prisma migration、API 契約更新、検索回帰テスト、UI 状態テストを追加し、設定値が欠落・破損しても一覧描画が継続できる設計にする。

*ゲート結果 (Phase 0 / Phase 1 後): PASS。回答は nullable text として扱い、設定値はクライアントローカル参照 + 安全な既定値、一覧 API は `answer` を返し検索対象に含める、テストで検索・表示・フォールバックを担保する条件で進める。*

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/001-card-answer-field/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── openapi.yaml
│   └── preferences.md
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
│       └── routes/
├── stories/
└── storybook-static/

prisma/
└── schema.prisma

tests/
├── backend/
├── frontend/
└── e2e/
```

**構造の決定 (Structure Decision)**: 既存の backend / frontend 分離構造を維持する。バックエンドは `prisma/schema.prisma` で `Card.answer` を追加し、`backend/src/services/searchService.ts` に検索条件、`backend/src/repositories/cardRepository.ts` に API 返却マッピングを集約する。フロントエンドは `frontend/src/domain/cardList.ts` に `answer` と表示設定型を追加し、`frontend/src/pages/CardList.tsx` でカード単位の回答表示状態と設定値読込を管理、`frontend/src/components/uniqueParts/CardItem.tsx` で表示リンク/省略表示をレンダリングする。設定画面自体は触らず、将来接続しやすいよう `frontend/src/services` か `frontend/src/utils` 配下に read-only の設定取得サービスを置く。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

現時点で追加の正当化が必要な憲法違反はない。
