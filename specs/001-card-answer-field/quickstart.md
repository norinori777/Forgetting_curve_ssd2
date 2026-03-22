# クイックスタート

このドキュメントは、機能 `001-card-answer-field` を現在のモノレポへ反映するための最小手順です。今回の計画では、カード回答の保存モデル、一覧 API、一覧検索、一覧表示、クライアントローカルの回答表示設定参照を追加します。

## 前提

- Node.js 18 以上
- npm
- PostgreSQL
- `DATABASE_URL` が利用可能

## 0. 環境変数を用意

リポジトリルートに `.env` を作成し、少なくとも `DATABASE_URL` を設定します。

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
PORT=3000
```

## 1. 依存関係をインストール

```bash
npm install
```

## 2. Prisma schema を開発DBへ同期

このリポジトリは historical baseline migration を持っていないため、ローカル開発環境では `migrate dev` ではなく `db push` で schema を同期します。`Card` に `answer` を追加したあと、Prisma Client を更新します。

```bash
npx prisma db push
npx prisma generate
```

## 3. 一覧 API を拡張

- `prisma/schema.prisma` に nullable な `answer` を追加する
- `backend/src/repositories/cardRepository.ts` の `ApiCard` と `toApiCard()` に `answer` を追加する
- `backend/src/services/searchService.ts` の `q` 検索対象へ `answer` を追加する
- `backend/contracts/openapi.yaml` と [contracts/openapi.yaml](contracts/openapi.yaml) の説明を更新する

## 4. フロントエンド型と設定参照を追加

- `frontend/src/domain/cardList.ts` の `ApiCard` に `answer` を追加する
- 回答表示モードを返す read-only service を `frontend/src/services` か `frontend/src/utils` 配下に追加する
- 設定キーは [contracts/preferences.md](contracts/preferences.md) に従って `fc.cardList.answerDisplayMode` を使う
- 未設定または不正値では `link` へフォールバックする

## 5. カード一覧 UI を更新

- `frontend/src/pages/CardList.tsx` でカード単位の回答表示状態を管理する
- `frontend/src/components/uniqueParts/CardItem.tsx` で以下を満たす
  - 回答がないカードは未回答表示にする
  - `link` モードでは「回答を表示」リンクを出し、押下したカードだけ回答本文へ置き換える
  - `inline` モードでは初期状態から回答本文を表示する
  - 長文回答は最大数行まで表示し、超過分は省略表示する

## 6. 開発サーバを起動

```bash
npm run dev:server
npm run dev:client
```

## 7. 回答表示モードを確認

設定画面 UI は今回未実装のため、ブラウザ開発者ツールで localStorage を直接設定して動作確認します。

```js
localStorage.setItem('fc.cardList.answerDisplayMode', 'link')
localStorage.setItem('fc.cardList.answerDisplayMode', 'inline')
localStorage.removeItem('fc.cardList.answerDisplayMode')
```

確認ポイント:

- `link`: 回答ありカードはリンク表示、押したカードだけ本文表示
- `inline`: 回答ありカードは初期表示から本文表示
- 未設定/不正値: `link` にフォールバック

## 8. テストと検証を実行

```bash
npm run lint
npm run test
npm run test:e2e
```

追加で確認するテスト観点:

- 回答あり/なしカードの API 返却
- 回答内一致による一覧検索
- 長文回答の省略表示
- `link` / `inline` / 不正値の各設定分岐
- 1 枚のカードだけ回答表示しても他カードへ影響しないこと

## 9. 完了チェック

- `Card.answer` migration が適用され、一覧 API が `answer` を返す
- 回答が未登録でも既存カード利用フローが崩れない
- 回答内の検索語でも一覧検索にヒットする
- 回答表示設定が `link` / `inline` で切り替わる
- 長文回答が一覧で省略表示され、レイアウトを崩さない
- 設定値が未設定または不正でも一覧が安全な既定表示で描画される
- 既存のフィルタ、ソート、無限スクロール、復習開始、バルク操作が回帰しない