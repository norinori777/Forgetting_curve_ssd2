# クイックスタート

このドキュメントは、機能 `001-study-card-create` を現在のモノレポへ反映し、学習カード登録画面と作成 API を確認するための最小手順です。

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

## 2. Prisma クライアントを生成

今回の計画では既存の Prisma model を利用する前提です。スキーマ変更を伴う場合のみ migration を追加します。

```bash
npx prisma generate
```

## 3. 共通メッセージ定義を用意する

- `docs/messages.md` を作成する
- 成功、失敗、バリデーション、補助文言を key 単位で整理する
- 見出しやボタンラベルはこのファイルへ移さない

## 4. バックエンドの作成 API を追加する

- `backend/src/schemas/cards.ts` に create request schema を追加する
- `backend/src/repositories/cardRepository.ts` に createCard 処理を追加する
- `backend/src/api/cards.ts` に `POST /api/cards` を追加する
- 未登録タグは upsert し、コレクションは既存候補のみ受け付ける

## 5. フロントエンドの登録画面を追加する

- `frontend/src/App.tsx` に `/cards/create` ルートを追加する
- ヘッダーメニューに「学習カード登録」を追加する
- `frontend/src/pages` に登録画面を追加し、タイトル、学習内容、タグ、コレクション入力、プレビュー、操作群を実装する
- カード一覧右上に「新規カード」ボタンを追加する

## 6. 成功後の一覧復帰を確認する

- 登録成功後は `/cards` へ戻る
- 一覧画面は成功メッセージを 1 回だけ表示する
- 作成したカードが一覧取得結果に含まれることを確認する

## 7. 開発サーバを起動する

```bash
npm run dev:server
npm run dev:client
```

## 8. 手動確認フロー

1. `/cards/create` を開く
2. タイトルと学習内容のみを入力して登録する
3. `/cards` へ戻り、成功メッセージが表示されることを確認する
4. タグに新規名を入力して登録し、保存後にタグがカードへ紐づくことを確認する
5. コレクション未選択でも登録できることを確認する
6. タイトルまたは学習内容が空だと登録できないことを確認する

## 9. テストと検証を実行する

```bash
npm run lint
npm run test
npm run test:e2e
```

## 10. 完了チェック

- ヘッダーメニューとカード一覧右上から登録画面へ遷移できる
- 登録画面でタイトル、学習内容、タグ、コレクションを扱える
- 未登録タグが新規作成されてカードへ紐づく
- コレクションは既存候補からのみ選択できる
- 成功、失敗、バリデーション、補助文言は `docs/messages.md` に定義されている
- 登録成功後はカード一覧へ戻り、成功メッセージが表示される