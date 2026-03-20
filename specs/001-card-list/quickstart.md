# クイックスタート

このドキュメントは、機能 `001-card-list` を既存モノレポへ実装するための最小手順です。今回の設計では、Tailwind CSS と `theme.json` によるトークン駆動 UI を前提にしています。

## 前提

- Node.js 18 以上
- npm
- PostgreSQL
- `DATABASE_URL` が利用可能

## 1. 依存関係をインストール

```bash
npm install
```

## 2. Prisma クライアント生成と DB マイグレーション

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 3. フロントエンドへ Tailwind CSS を導入

実装時点で未導入の場合は、`frontend` workspace に Tailwind を追加します。

```bash
npm --workspace frontend install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 4. `theme.json` を Tailwind に接続

- `frontend/tailwind.config.ts` を作成し、`specs/001-card-list/theme.json` を import して `theme.extend` に反映する
- `frontend/src/index.css` などのエントリ CSS に Tailwind directive を追加する
- `ascii_ui.txt` の画面構成に合わせて `CardList`、ステータスフィルタのプルダウン、タグ/コレクション共用選択モーダルを Tailwind クラスで再構成する

## 5. 開発サーバ起動

```bash
npm run dev:server
npm run dev:client
```

## 6. テスト実行

```bash
npm run test
npm run test:e2e
```

## 7. 実装完了の確認ポイント

- 一覧画面が `ascii_ui.txt` の構成に整合している
- 色、余白、角丸、フォント、ブレークポイントが `theme.json` のトークンで表現されている
- ステータスフィルタのプルダウンが単一選択で動作する
- タグ/コレクションの共用複数選択モーダルが、ラジオ切替と検索付きで動作する
- ソート条件が一覧表の上部で表示・変更できる
- 検索、フィルタ、ソート、無限スクロール、バルク操作、削除確認、復習開始の挙動が既存仕様から変化していない
