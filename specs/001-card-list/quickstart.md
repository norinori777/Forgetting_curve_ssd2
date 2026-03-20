# クイックスタート

このドキュメントは、機能 `001-card-list` を現在のモノレポへ反映するための最小手順です。今回の計画では、既存のカード一覧実装を保持しつつ、React Router による共通レイアウトと clarified spec に沿った契約整理を追加します。

## 前提

- Node.js 18 以上
- npm
- PostgreSQL
- `DATABASE_URL` が利用可能

## 1. 依存関係をインストール

```bash
npm install
```

## 2. ルーティング依存を追加

`frontend/package.json` にはまだ React Router が入っていないため、先に追加します。

```bash
npm --workspace frontend install react-router-dom
```

## 3. Prisma クライアントを生成

今回の計画では DB スキーマ変更は前提にしないため、通常は generate だけで足ります。スキーマを変えた場合のみ migrate を追加します。

```bash
npx prisma generate
```

## 4. 共通レイアウトとルートを実装

- `frontend/src/App.tsx` を React Router ベースへ変更する
- 共通レイアウトでヘッダー、パンくず、フッターを固定し、本文は Outlet で切り替える
- `/` をホーム、`/cards` をカード一覧、`/review`、`/stats`、`/settings` をプレースホルダーとして定義する
- パンくずは現在ページ名のみ表示する

## 5. カード一覧の clarified behavior を維持する

- `frontend/src/pages/CardList.tsx` の query key 変更時に選択クリア + 先頭再取得を維持する
- `FilterSelectionModal` をタグ/コレクション共有モーダルとして使い、タグ一括付与/削除にもタグ限定モードで再利用する
- バルクアーカイブ後は再取得で既定一覧から対象が消えることを確認する
- 復習開始は現在の `CardListFilter` を `/api/review/start` へ渡し、選択状態は送らない

## 6. テーマと UI を同期する

- リポジトリルートの `theme.json` を Tailwind 設定へ接続する
- `ascii_ui.txt` に沿って、検索バー、ステータスプルダウン、タグ/コレクション選択ボタン、ソート埋め込みヘッダ、選択バー、一覧、モーダルを配置する
- 直書き CSS は避け、Tailwind クラスとトークン参照を優先する

## 7. 開発サーバを起動する

```bash
npm run dev:server
npm run dev:client
```

## 8. テストと検証を実行する

```bash
npm run lint
npm run test
npm run test:e2e
```

## 9. 完了チェック

- `/` がホーム、`/cards` が実一覧、その他トップレベルルートがプレースホルダーとして表示される
- ヘッダー、パンくず、フッターがルート切り替えで再マウントされず共通表示される
- ステータスフィルタは単一選択で動作する
- 検索、フィルタ、ソート変更時に選択がクリアされる
- タグ一括付与/削除は冪等で、再試行しても不整合にならない
- バルクアーカイブ後は既定一覧から即時に除外される
- 復習開始は現在の絞り込み結果を対象にする
- `ascii_ui.txt` と `theme.json` に対する乖離がない
