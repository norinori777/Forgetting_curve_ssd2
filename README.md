# Forgetting Curve

復習対象の管理、学習カード登録、レビュー実行、統計確認を行う学習支援アプリです。

フロントエンドは React + Vite、バックエンドは Express + Prisma、データベースは PostgreSQL を使用しています。

## 主な機能

- 学習カードの単票登録
- CSV による学習カードの一括登録
- タグとコレクションによる整理
- 復習セッションの開始と回答記録
- ホーム画面での学習状況サマリ表示
- 統計画面での学習状況の可視化
- Settings 画面でのコレクション管理
- Storybook による UI コンポーネント確認

## 技術スタック

- Frontend: React 18, React Router, Vite, Tailwind CSS, Storybook
- Backend: Express 4, Zod
- Database: PostgreSQL, Prisma
- Test: Vitest, Testing Library, Supertest, Playwright
- Language: TypeScript

## ディレクトリ構成

```text
.
|-- backend/        Express API
|-- frontend/       React + Vite app
|-- prisma/         Prisma schema and migrations
|-- tests/          backend/frontend/e2e/perf tests
|-- docs/           supplementary docs
|-- specs/          feature specs and implementation plans
```

## 画面構成

- `/` ホーム
- `/cards` カード一覧
- `/cards/create` カード登録
- `/review` 復習画面
- `/stats` 統計画面
- `/settings` 設定画面

## セットアップ

### 前提

- Node.js 18 以上
- npm
- PostgreSQL

### インストール

```bash
npm install
```

### 環境変数

プロジェクトルートに `.env` を作成し、少なくとも以下を設定してください。

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/forgetting_curve
PORT=3000
```

### Prisma

クライアント生成:

```bash
npm run prisma:generate
```

必要に応じて migration を適用してください。

```bash
npx prisma migrate dev
```

## 開発起動

バックエンドを起動:

```bash
npm run dev:server
```

フロントエンドを別ターミナルで起動:

```bash
npm run dev:client
```

フロントエンドの開発サーバーは Vite を使い、`/api` を `http://localhost:3000` にプロキシします。

## 利用可能なスクリプト

ルート:

- `npm run dev:server` バックエンド起動
- `npm run dev:client` フロントエンド起動
- `npm run build` ワークスペース全体をビルド
- `npm run test` ワークスペース全体のテスト実行
- `npm run test:e2e` Playwright E2E テスト実行
- `npm run lint` ワークスペース全体の lint 実行
- `npm run format` Prettier 実行

frontend:

- `npm --workspace frontend run storybook` Storybook 起動
- `npm --workspace frontend run build-storybook` Storybook ビルド

backend:

- `npm --workspace backend run start` ビルド済みバックエンド起動

## テスト

単体・統合テスト:

```bash
npm run test
```

E2E テスト:

```bash
npm run test:e2e
```

Storybook ビルド確認:

```bash
npm --workspace frontend run build-storybook
```

## CSV 一括登録

カード登録画面では CSV ファイルから学習カードを一括登録できます。期待フォーマットは 5 列です。

```csv
タイトル,学習内容,回答,タグ,コレクション
```

- 1列目: タイトル
- 2列目: 学習内容
- 3列目: 回答
- 4列目: タグ
- 5列目: コレクション

補足:

- 回答、タグ、コレクションは値を空にできます
- 列自体は省略できません
- タグはセミコロン区切りです
- 学習内容や回答の改行は `\n` で表現します
- 対応文字コードは UTF-8、UTF-8 BOM、Shift_JIS です

## API 概要

バックエンドでは主に以下の API を提供しています。

- `/health`
- `/api/home`
- `/api/stats`
- `/api/cards`
- `/api/cards/bulk`
- `/api/tags`
- `/api/collections`
- `/api/review`

## 補足ドキュメント

- `docs/` に画面や API 補助資料があります
- `specs/` に機能仕様、調査、タスク分解、契約定義があります
