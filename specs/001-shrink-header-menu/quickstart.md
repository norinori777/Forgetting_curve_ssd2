# Quickstart: 共通ヘッダー簡素化

## 1. Setup

1. ルートで依存関係をインストールする

```bash
npm install
```

2. 開発サーバーを起動する

```bash
npm run dev:server
npm run dev:client
```

## 2. Manual Verification

### Desktop

1. `/cards` を開き、breadcrumb 専用領域が表示されないことを確認する
2. Header メニューに `ホーム` が存在しないことを確認する
3. Header 左側のブランド領域をクリックし、`/` へ遷移できることを確認する
4. `/cards/create`, `/review`, `/stats`, `/settings` を順に開き、各ページで本文見出しまたは進行ヘッダーにより現在地を認識できることを確認する
5. どのページでも本文先頭が固定ヘッダーに隠れないことを確認する

### Mobile

1. ブラウザ幅をモバイル相当に縮める
2. Header が breadcrumb なしの compact layout になっていることを確認する
3. メニューの wrap 後も `学習カード登録`, `カード一覧`, `復習`, `統計`, `設定` に到達できることを確認する
4. ブランド領域からホームへ戻れることを確認する
5. 初回表示で本文や主要操作の見える範囲が従来より増えていることを確認する

## 3. Automated Checks

```bash
npm run lint
npm run test --workspaces
```

必要に応じてトップレベル導線の E2E スモークも実行する。

```bash
npm run test:e2e
```

## 4. Expected Test Coverage

- `AppLayout` またはルートメタデータに対する unit/UI テスト
  - breadcrumb が描画されない
  - ブランド領域が `/` へ遷移する
  - メニューから `ホーム` が除外される
- 必要に応じて E2E スモーク
  - `/stats` などからブランド領域経由でホームへ戻れる
  - compact header でも本文先頭が隠れない