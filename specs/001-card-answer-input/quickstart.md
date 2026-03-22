# クイックスタート

このドキュメントは、機能 `001-card-answer-input` を現在のモノレポへ反映し、学習カード登録画面で回答欄を扱えるようにするための最小手順です。

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

## 2. Prisma schema を開発DBへ同期

この repo では local development の基準手順として `migrate dev` ではなく `db push` を使う。

```bash
npx prisma db push
npx prisma generate
```

## 3. create API に answer を追加する

- `prisma/schema.prisma` に optional `answer` を追加する
- `backend/src/schemas/cards.ts` の create request schema に `answer` を追加する
- `backend/src/repositories/cardRepository.ts` の create / response mapping に `answer` を追加する
- `backend/src/api/cards.ts` の request logging と response shaping が answer 追加後も整合することを確認する

## 4. フロントエンドの登録 draft / form / preview を拡張する

- `frontend/src/domain/cardCreate.ts` に `draft.answer` と `CreateCardRequest.answer` を追加する
- `frontend/src/components/uniqueParts/CardCreateForm.tsx` に複数行の回答入力欄を追加する
- `frontend/src/components/uniqueParts/CardCreatePreview.tsx` に回答全文のプレビュー表示を追加する
- `frontend/src/pages/CardCreate.tsx` で draft 保存、送信、リセット、失敗時再試行に answer を含める

## 5. 正規化ルールを確認する

- 回答未入力は登録可能
- 回答が空白のみなら未登録として扱う
- 空白のみではない複数行回答は改行を維持して保存する

## 6. メッセージ定義を見直す

- 既存の `docs/messages.md` で流用できる文言は再利用する
- 回答欄専用の新規メッセージが本当に必要な場合のみ追加する

## 7. 開発サーバを起動する

```bash
npm run dev:server
npm run dev:client
```

## 8. 手動確認フロー

1. `/cards/create` を開く
2. タイトル、学習内容、複数行回答を入力する
3. プレビューに回答全文が表示されることを確認する
4. 登録して、保存結果に answer が含まれることを確認する
5. 回答欄を空欄のまま登録し、カード登録が成功することを確認する
6. 回答欄に空白のみを入れて登録し、未登録として扱われることを確認する
7. API エラーを起こし、回答欄を含む draft が保持されることを確認する

## 9. テストと検証を実行する

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```

## 10. 完了チェック

- 登録画面に任意の複数行回答欄が表示される
- 回答付き登録が成功する
- 回答未入力でも登録できる
- 空白のみ回答は未登録として正規化される
- 登録前プレビューで回答全文を確認できる
- 登録失敗時に回答欄を含む入力内容が保持される