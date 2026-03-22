# 実装計画 (Implementation Plan): 学習カード登録画面 (001-study-card-create)

**ブランチ (Branch)**: `001-study-card-create` | **日付 (Date)**: 2026-03-21 | **仕様 (Spec)**: `specs/001-study-card-create/spec.md`
**入力 (Input)**: `specs/001-study-card-create/spec.md` の機能仕様

## 概要 (Summary)

既存の React + Express + Prisma 構成を維持しながら、学習カードの新規登録フローを追加する。フロントエンドでは共通レイアウト配下に学習カード登録ページとヘッダーメニュー導線を追加し、カード一覧右上の「新規カード」からも遷移できるようにする。バックエンドでは `POST /api/cards` を新設し、タイトル・学習内容・タグ名・コレクション選択を受け取り、未登録タグはトランザクション内で upsert してカードへ紐づける。成功・失敗・バリデーション・補助文言は共通仕様 `docs/messages.md` に集約し、画面仕様と実装はそこを参照する。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18+  
**フロントエンド (Frontend)**: React 18.3 + Vite 5 + React Router DOM 7.13  
**バックエンド (Backend)**: Express 4 + Zod 3  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6  
**CSS**: Tailwind CSS 3.4 (`theme.json` をトークン正本として扱う)  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2 + Testing Library + Supertest + Playwright  
**テスト実施方法**: テスト手順・ケース定義はリポジトリルートの `test.md` に従い、`npm run test` と `npm run test:e2e` を基本コマンドとする  
**対象プラットフォーム (Target Platform)**: Web SPA + JSON API  
**プロジェクト種別 (Project Type)**: backend / frontend 分離のモノレポ Web application  
**性能目標 (Performance Goals)**: 画面遷移はフルリロード無しで行い、必須入力のバリデーション結果はユーザー操作直後に認識できること。登録成功/失敗は送信完了後すぐにユーザーへ提示し、一覧復帰後に完了メッセージを表示すること  
**制約 (Constraints)**: 既存の `/cards` 一覧挙動と共通レイアウトを壊さないこと。コレクション新規作成と下書き保存は今回のスコープ外。メッセージ管理は `docs/messages.md` に集約し、見出し・ボタン名・ラベル・プレースホルダーは画面仕様側に残すこと。Prisma モデルの必須初期値は API 側で補完すること  
**規模/スコープ (Scale/Scope)**: 1 つの新規ページ、1 つの新規 API mutation、既存候補 API の再利用、1 つの共通メッセージ定義、フロント/バック/契約/ドキュメント/テスト更新を含む中規模 feature

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に通過済み。Phase 1 の設計後に再チェック済み。*

- 正確性: 登録 API はタイトル・学習内容・タグ・コレクションを検証し、未登録タグはトランザクション内で新規作成して正しく紐づける。コレクションは既存候補のみを受け付け、存在しない ID は弾く。学習スケジューリング自体は変更せず、新規カード初期値のみを明示する。
- 継続性・UX: ヘッダーメニューとカード一覧の両方から最短導線で登録画面へ到達でき、成功後はカード一覧へ戻して完了メッセージを示す。入力プレビューと必須項目エラーにより迷いを減らす。
- プライバシーとデータ最小化: 作成 API は登録に必要な最小データのみ受け取り、レスポンスも作成されたカードの最小表示情報に留める。`docs/messages.md` は文言定義のみを持ち、個人情報を含めない。
- 説明可能性: バリデーション、送信失敗、成功メッセージ、タグ入力補助文言を `docs/messages.md` に集約し、プレビュー領域で入力内容を可視化する。
- 信頼性・セキュリティ: Zod による入力検証、Prisma トランザクションによる card、tag、card_tags の原子更新、Vitest、Supertest、Playwright による回帰テスト追加を前提とする。登録送信失敗時はユーザーが同一入力内容のまま再試行できることを保証し、少なくとも画面遷移や API エラーでは入力途中データをローカル状態に保持する。ネットワーク失敗時は明瞭な再試行導線を提供し、必要に応じて一時的なローカルフォールバックを行う。バックエンドの create API では構造化ログを採用し、INFO、ERROR、DEBUG のレベルを使い分け、タイトルや学習内容などの個人性の高い入力内容をログへ出力しない

*ゲート結果 (Phase 0 / Phase 1 後): PASS。共通メッセージ定義、タグ upsert、既存コレクション選択、成功時リダイレクト、回帰テスト追加を必須条件として設計を進める。*

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/001-study-card-create/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md

docs/
└── messages.md
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
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   │   └── api/
│   └── utils/
└── stories/
```

**構造の決定 (Structure Decision)**: backend / frontend 分離構造を維持する。バックエンドは `backend/src/api/cards.ts` に create endpoint、`backend/src/schemas/cards.ts` に Zod schema、`backend/src/repositories/cardRepository.ts` に Prisma トランザクションを集約する。フロントエンドは `frontend/src/pages` を画面統合層とし、新規の登録ページを追加したうえで `frontend/src/App.tsx` と `frontend/src/utils/routes/topLevelPages.ts` でルーティングとヘッダー導線を拡張する。共通メッセージは feature 専用ではなく repo 全体の `docs/messages.md` に置き、spec / plan / tasks から参照する。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

現時点で追加の正当化が必要な憲法違反はない。
