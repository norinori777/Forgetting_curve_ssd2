# クイックスタート

このドキュメントは、機能 `001-collection-settings` を現在のモノレポへ反映し、設定画面でのコレクション作成・変更・削除を確認するための最小手順です。

## 前提

- Node.js 18 以上
- npm
- PostgreSQL
- `DATABASE_URL` が利用可能

## 0. 環境変数を用意

リポジトリルートの `.env` に少なくとも次を設定します。

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
PORT=3000
```

## 1. 依存関係をインストール

```bash
npm install
```

## 2. Prisma migration と client を更新

- `Collection` に `description` と `normalizedName` を追加する migration を作成する
- migration 適用後に Prisma Client を再生成する

```bash
npx prisma migrate dev --name add_collection_management_fields
npx prisma generate
```

## 3. バックエンドの collections 管理 API を追加する

- `backend/src/api/collections.ts` に `GET/POST/PATCH/DELETE /api/collections/manage...` を追加する
- `backend/src/schemas` に create / update 用 schema を追加する
- `backend/src/repositories` に一覧取得、作成、更新、削除ガード付き削除を実装する
- 既存の `GET /api/collections` option-search contract は変更しない

## 4. owner provider を追加する

- 認証基盤が未実装のため、server-side に単一ユーザ owner 解決 helper を追加する
- route や repository が固定値を直接持たないようにする

## 5. フロントエンドの設定画面を置き換える

- `frontend/src/pages/Settings.tsx` をコレクション管理画面へ置き換える
- 新規登録フォーム、管理一覧、編集モーダル、削除確認、削除不可表示を実装する
- API 呼び出しは `frontend/src/services/api` に集約する

## 6. 開発サーバを起動する

```bash
npm run dev:server
npm run dev:client
```

## 7. 手動確認フロー

1. `/settings` を開く
2. 新しいコレクション名と補足メモを入力して登録する
3. 一覧に新しいコレクションが反映されることを確認する
4. 一覧から `編集` を押し、モーダルで名前または補足メモを更新する
5. 更新後に一覧へ最新内容が反映されることを確認する
6. カード未所属コレクションを `削除` し、確認後に一覧から消えることを確認する
7. カードが紐づくコレクションで `削除` を押し、削除不可理由が表示されることを確認する
8. 重複名で作成または更新しようとした場合、重複エラーが表示されることを確認する

## 8. テストと検証を実行する

```bash
npm run lint
npm run test
npm run test:e2e
```

## 9. 完了チェック

- 設定画面でコレクションの一覧取得、作成、更新、削除確認が行える
- 編集は一覧行から開くモーダルで完結する
- カードが紐づくコレクションは削除できず、理由が表示される
- 重複名は owner 単位で防止される
- 既存の `GET /api/collections` を利用する候補選択 UI が回帰しない