# quickstart.md

このドキュメントは 001-review-screen を現行モノレポへ実装するための最小手順です。review screen は、カード一覧から開始した復習 session をサーバ側に永続化し、Review ページで 1 枚ずつ再開できるようにします。

## 前提

- Node.js 18 以上
- npm
- PostgreSQL
- DATABASE_URL が利用可能

## 1. 依存関係を用意

```bash
npm install
npx prisma generate
```

## 2. review session 用の Prisma モデルを追加する

- prisma/schema.prisma に ReviewSession と ReviewSessionCard を追加する
- session status、currentCardIndex、source filter summary、assessment lock 用フィールドを定義する
- migration を作成する

```bash
npx prisma migrate dev --name add_review_session_tables
```

## 3. backend contract と domain を拡張する

- backend/src/schemas/review.ts に start / snapshot / assessment / navigation の request schema を追加する
- backend/src/domain/review.ts に ReviewSessionSnapshot などの DTO を追加する
- backend/src/repositories/reviewSessionRepository.ts を追加し、session 作成、snapshot 取得、assessment 更新、navigation 更新を実装する
- backend/src/api/review.ts で以下の API を提供する
  - POST /api/review/start
  - GET /api/review/sessions/:sessionId
  - PUT /api/review/sessions/:sessionId/assessment
  - POST /api/review/sessions/:sessionId/navigation

## 4. frontend の review flow をつなぐ

- frontend/src/services/api/reviewApi.ts を snapshot ベースの client に更新する
- frontend/src/domain/review.ts に snapshot / assessment enum / navigation command の型を追加する
- frontend/src/pages/CardList.tsx で review start 成功後に /review?sessionId=... へ遷移する
- frontend/src/pages/Review.tsx で以下を実装する
  - sessionId を URL から取得し、なければ保存済み sessionId で resume
  - snapshot 読み込み
  - answerVisible の client-only state
  - assessment 更新
  - prev / next 移動
  - empty / error / completed state
  - keyboard shortcut
  - review reason と session identifier の低強調表示

## 5. resume 動作を仕上げる

- 最後に開いていた進行中 sessionId を browser storage に保存する
- Review ページ再訪時に in-progress session を再取得する
- completed session は完了サマリ表示後に resume キーをクリアする
- 一時的な通信失敗時は cached snapshot を表示し、未同期評価は localStorage に保持して再送する

## 6. OpenAPI と docs を同期する

- backend/contracts/openapi.yaml を review session contract に合わせて更新する
- [contracts/openapi.yaml](./contracts/openapi.yaml) と差分がないことを確認する

## 7. テストを追加する

- tests/backend/review.test.ts
  - session start
  - no cards / invalid body
  - assessment before next
  - lock after advance
  - resume snapshot
- tests/frontend/review.test.tsx
  - loading / empty / error / completed
  - answer hidden until reveal
  - no next before assessment
  - overwrite assessment before next
  - no re-edit after advance
  - cached snapshot fallback / pending assessment resend
  - review reason / session identifier / keyboard shortcut
- tests/e2e/review-screen.spec.ts
  - カード一覧から復習開始して完了サマリまで到達
  - 復習画面離脱後に同じ session へ戻れる
  - 一時通信失敗から retry で回復できる

## 8. 検証コマンドを実行する

```bash
npm run lint
npm run test
npm run test:e2e
```

## 9. 完了チェック

- 復習開始で /review へ遷移し、現在カード、進捗、開始条件要約が表示される
- 回答表示前は自己評価できない
- 自己評価後も自動遷移せず、明示的な next が必要
- 未評価では next できない
- current card に留まっている間だけ自己評価を上書きできる
- next 後は前カードへ戻っても再編集できない
- 一覧へ戻ってから /review に再訪すると同じ session が再開される
- review reason と session identifier が補助情報として低強調で表示される
- 一時通信失敗時でも cached snapshot と未同期評価の再送導線で進行状況を失わない
- 完了時に評価別件数サマリが表示される
