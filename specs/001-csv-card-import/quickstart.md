# quickstart.md

## 目的

学習カード登録画面に追加する CSV 一括登録機能を、ローカル開発環境で最短確認する。

## 前提

- Node.js 18 以上
- ルートで `npm install` 済み
- Prisma Client が最新であること（必要なら `npm run prisma:generate`）
- backend / frontend の開発サーバーを別ターミナルで起動できること

## 起動手順

1. ルートで依存関係をインストールする

```bash
npm install
```

1. backend を起動する

```bash
npm run dev:server
```

1. frontend を起動する

```bash
npm run dev:client
```

1. ブラウザで学習カード登録画面を開く

```text
http://localhost:5173/cards/create
```

## 正常系サンプル CSV

ヘッダー付きでもヘッダー無しでもよい。複数タグはセミコロン区切り、学習内容の改行は `\n` 表現を使う。回答列は任意で、空欄なら未設定として扱う。

```csv
タイトル,学習内容,回答,タグ,コレクション
英単語セットA,photosynthesis = 光合成\nsunlight を使って栄養をつくる,植物が光エネルギーを使って糖を合成するはたらき,英語;基礎,TOEIC 600
化学用語集,pH = 水素イオン濃度指数,,理科,
```

## 手動確認

1. 画面上で `CSV一括登録` セクションを開く。
2. 上記 CSV を UTF-8 または Shift_JIS で保存し、アップロードする。
3. プレビューに件数、行一覧、検出文字コードが表示され、`一括登録する` が有効になることを確認する。
4. `一括登録する` を押下し、カード一覧へ遷移した後に登録件数を含む成功メッセージが表示されることを確認する。
5. 一覧に取り込んだカードが表示され、TOEIC 600 の行だけ collection が紐づいていることを確認する。
6. 回答列に値を入れた行は回答付きカードとして保存され、空欄行は回答未設定として保存されることを確認する。

## 異常系サンプル CSV

```csv
タイトル,学習内容,回答,タグ
世界史年号,1492 = コロンブス到達,,社会
長文読解,関係代名詞の用法,先行詞を修飾する節,英語;応用,存在しないコレクション
```

## 異常系確認

1. 5 列未満の CSV をアップロードし、列不足エラーが表示されることを確認する。
2. 存在しない collection 名を含む CSV をアップロードし、行番号付きで collection 不一致が表示されることを確認する。
3. エラーが 1 件でもある間は `一括登録する` を押せない、または押しても import が実行されないことを確認する。
4. 正常 CSV に差し替えると前回エラーが消え、再度 import 可能になることを確認する。

## 自動テスト

1. unit / integration を実行する

```bash
npm run test
```

1. E2E を実行する

```bash
npm run test:e2e
```

## 期待する更新対象

- `docs/messages.md` に CSV import 用の success / error / helper 文言を追加
- `backend/src/api/cards.ts`、`backend/src/schemas/cards.ts`、`backend/src/repositories/cardRepository.ts` に validate/import 処理を追加
- `frontend/src/pages/CardCreate.tsx` と CSV import 関連 component / domain / api client を追加
