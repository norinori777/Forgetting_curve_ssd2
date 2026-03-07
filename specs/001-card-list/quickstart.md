 # クイックスタート

このディレクトリは機能 `001-card-list` の実装およびテストを始めるための最小手順を示します。

前提:
- Node.js と npm/yarn（バージョンは Phase 1 で確定）
- PostgreSQL（ローカル環境）

手順:

1. リポジトリをクローン

2. 依存関係をインストール（プロジェクトルートで）

```bash
# Node.js (>=18) 前提
npm install
```

3. データベースを作成してマイグレーションを実行（例: Prisma を使う場合）

```bash
# 例: PostgreSQL
# DATABASE_URL を設定してください（.env を使う場合はプロジェクトルートに作成）
# 例: postgresql://USER:PASSWORD@localhost:5432/forgetting_curve_dev?schema=public

npx prisma generate
npx prisma migrate dev --name init
```

4. 開発サーバを起動（バックエンドとフロントエンド）

```bash
# バックエンド
npm run dev:server
# フロントエンド
npm run dev:client
```

5. E2E テストを実行

```bash
# フロントを起動した状態で（別ターミナルで）
npx playwright test
```

6. ユニットテストを実行

```bash
# backend + frontend のユニットテスト（Vitest）
npm --workspace backend run test
```

注: 上記は推奨スタックに基づく例です。リポジトリの実態に合わせてコマンドやツールを調整してください。
