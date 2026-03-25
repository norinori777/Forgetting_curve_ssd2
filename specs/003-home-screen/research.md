# Research: ホーム画面 ASCII UI デザイン

## Decision 1: ホームデータは専用 `GET /api/home` で取得する

- Decision: summary 4 指標、recent activities 3 件、状態フラグをまとめて返す専用 endpoint を追加する。
- Rationale: 既存 `/api/cards` は一覧取得向けで件数 API ではなく、ホームに必要な today / overdue / unlearned / streak / recent activities をクライアント側で合成すると、リクエスト回数が増え、review start 対象との整合性も崩れやすい。server-side で 1 snapshot を返す方が、憲法の継続性・UXとデータ最小化に合う。
- Alternatives considered:
  - 既存 cards/review API をクライアントで複数回呼ぶ: 件数算出に不要なカード本文まで取得しやすく、today 件数と review start の解決結果がずれるため却下。
  - `/api/cards` に count を足して流用する: recent activities と streak を別経路で取る必要が残り、責務が混ざるため却下。

## Decision 2: today / overdue / unlearned の意味は既存 search filter に一致させる

- Decision: `todayDueCount` は当日終了時刻まで、`overdueCount` は当日開始時刻より前、`unlearnedCount` は `proficiency = 0` とする。
- Rationale: `backend/src/services/searchService.ts` に既存の filter 意味があり、ホームだけ別定義にすると説明可能性と review start の正確性が損なわれる。
- Alternatives considered:
  - overdue を today と排他的な別カテゴリとして独自計算する: 既存 cards filter と意味がずれ、ユーザが一覧とホームの数字を比較した際に混乱するため却下。
  - unlearned を `nextReviewAt` 未設定ベースで判定する: 現在のドメインでは `proficiency` が既存の明示指標であるため却下。

## Decision 3: `復習を始める` は既存 review start API を `filter: today` で再利用する

- Decision: ホームから新規の review session 作成ロジックを持たず、`frontend/src/services/api/reviewApi.ts` の `startReview('today')` を利用する。
- Rationale: review start は server-side で対象カード全体を解決する実装と知見が既にあり、ホームが別ロジックを持つと対象上限や並び順が再びずれる。
- Alternatives considered:
  - ホームでカード ID を先に収集して `/api/review/start` に渡す: paginated 一覧や DOM 上の部分集合から解決してしまう危険があり却下。
  - `/api/home/start-review` の専用 API を追加する: review API と責務が重複するため却下。

## Decision 4: recent activities は 3 件の主要イベント要約だけを返す

- Decision: `review_completed`、`review_started`、`card_created` の 3 種別を対象にし、表示用短文と件数だけ返す。
- Rationale: ホームの目的は次の行動を示すことにあり、詳細履歴やカード本文は不要。最大 3 件に制限することでレスポンスと UI 分岐を単純化できる。
- Alternatives considered:
  - 詳細履歴一覧を返す: 情報量が過剰で、カード内容や個人学習の詳細まで露出しやすいため却下。
  - activities を表示しない: 仕様の FR-006 を満たせないため却下。

## Decision 5: ホーム状態は `firstUse` と `noReviewToday` のフラグで表し、取得失敗は HTTP エラーで扱う

- Decision: 200 レスポンスには `firstUse` と `noReviewToday` を含め、API 失敗は 503 と `home_temporary_failure` で返す。
- Rationale: 初回利用と今日の復習なしは正常系の分岐であり、payload に含める方が UI が単純になる。一方で取得失敗は既存 review API と同様に非 2xx で扱う方がエラーハンドリングが揃う。
- Alternatives considered:
  - `state: 'error'` を成功 payload に含める: 成功と失敗の境界が曖昧になり、キャッシュや再試行戦略が複雑になるため却下。
  - first-use / no-review をメッセージ文字列だけで判定する: UI が文言依存になり、テストもしにくいため却下。

## Decision 6: テストは backend API 契約テストと frontend 状態表示テストを最小セットにする

- Decision: backend は `tests/backend/home.test.ts`、frontend は `tests/frontend/home.test.tsx` を追加し、必要なら e2e を 1 本追加する。
- Rationale: `test.md` は branch coverage と境界値テストを必須としている。ホームは today / overdue / firstUse / noReviewToday / error の分岐が中心なので、API 契約と UI 状態描画を分けて検証するのが最小で十分。
- Alternatives considered:
  - フロントだけをテストする: 集計意味や境界が担保できないため却下。
  - E2E のみで担保する: 失敗原因の切り分けが難しく、境界時刻テストも重くなるため却下。