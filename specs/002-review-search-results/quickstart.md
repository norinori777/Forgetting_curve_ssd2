# Quickstart: Search Results Review Start

## 1. 前提

- Node.js 18 以上
- PostgreSQL と Prisma の既存開発環境が利用可能であること
- ルートで依存関係をインストール済みであること

## 2. 開発サーバ起動

```bash
npm run dev:server
npm run dev:client
```

## 3. 手動確認シナリオ

### シナリオ A: 検索結果からそのまま復習開始

1. カード一覧を開く
2. 検索欄にキーワードを入力し、2 件以上のカードを結果として表示する
3. 「復習開始」を押す
4. Review 画面へ遷移することを確認する
5. 1 枚目のカードが検索結果の対象に含まれていることを確認する
6. 次へ進み、以降も同じ検索結果に含まれていたカードだけが表示されることを確認する

### シナリオ B: 条件変更後の最新検索結果が使われる

1. カード一覧でキーワード A を入力する
2. すぐにキーワード B に変更して結果を更新する
3. その状態で「復習開始」を押す
4. Review 画面の filter summary と表示カードが、キーワード B の結果に対応していることを確認する

### シナリオ C: 空結果では開始しない

1. カード一覧で一致件数が 0 件になる検索条件を入力する
2. 空状態の説明を確認する
3. 復習開始を試みても、空の Review 画面に進まず、条件見直しまたは一覧へ戻る導線が表示されることを確認する

### シナリオ D: 200 件を超える結果は 200 件までで開始し、除外理由を表示する

1. 学習カード一覧で 200 件を超える検索結果が得られる条件を作る
2. その状態で「復習開始」を押す
3. Review 画面へ遷移し、開始対象が 200 件であることを確認する
4. 画面上で、超過分が上限超過により除外された件数と理由を確認する

### シナリオ E: 開始直前に一部カードが利用不能になっても開始を継続する

1. 学習カード一覧で複数件の検索結果を表示する
2. 復習開始直前に、そのうち一部が利用不能になる状態を作る
3. 「復習開始」を押す
4. 利用可能なカードだけで Review 画面へ遷移することを確認する
5. 画面上で、利用不能により除外された件数と理由を確認する

## 4. API 確認例

### 復習開始

```bash
curl -X POST http://localhost:3000/api/review/start \
  -H "content-type: application/json" \
  -d '{
    "filter": {
      "q": "react",
      "sort": "next_review_at",
      "tagIds": [],
      "collectionIds": []
    }
  }'
```

期待結果:

- 200 の場合、`snapshot.sessionId` と `snapshot.currentCard` が返る
- 200 件超または一部利用不能があった場合、`snapshot.filterSummary.targetResolution` に `includedCount`、`excludedCount`、`exclusionBreakdown` が含まれる
- 404 の場合、現在の検索条件に一致する復習対象が存在しない

### session snapshot 取得

```bash
curl http://localhost:3000/api/review/sessions/<sessionId>
```

期待結果:

- `filterSummary` に検索語、filter、sort、tag/collection label が入る
- 除外があった場合、`filterSummary.targetResolution` に開始時の除外件数と理由が入る
- `currentCard` は開始時点の検索結果集合に含まれるカードのみ返す

## 5. 自動テスト

```bash
npm run test
npm run test:e2e
```

重点テスト対象:

- backend: filter から ordered target set を解決し session を作る分岐
- backend: 200 件上限適用時と unavailable 除外時の `exclusionBreakdown` 生成
- frontend: 一覧の最新検索条件で `startReview()` が呼ばれること
- e2e: 検索結果から Review 画面へ遷移し、対象カードだけを順番に復習できること
- e2e: 200 件超と unavailable 除外の注意文が開始直後に表示されること

## 6. 完了チェック

- 一覧の検索結果が 1 件以上あるとき、Review 画面へ遷移できる
- Review 画面で表示されるカードが開始時点の検索結果集合と一致する
- 一覧で条件を変えてから開始すると、変更後の結果が対象になる
- 空結果では review session が作成されない
- 200 件を超える結果では、200 件までで開始され、超過件数が表示される
- 一部カードが利用不能でも、残りが 1 件以上あれば開始され、除外件数が表示される
- 既存の自己評価、前後移動、完了サマリの挙動が壊れていない
