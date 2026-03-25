# Data Model: ホーム画面 ASCII UI デザイン

## 1. HomeDashboardResponse

- Purpose: ホーム画面初期表示に必要な最小 snapshot を返す API レスポンス。
- Fields:
  - `generatedAt`: string, ISO 8601, required
  - `summary`: HomeSummary, required
  - `recentActivities`: RecentActivity[], required, length 0..3
  - `state`: HomeViewState, required
- Validation:
  - `generatedAt` は有効な日時文字列であること
  - `recentActivities` は発生日時の降順で返すこと
  - payload にカード本文、回答、タグ詳細を含めないこと

## 2. HomeSummary

- Purpose: 画面上部の 4 指標を表す集計単位。
- Fields:
  - `todayDueCount`: integer, required, min 0
  - `overdueCount`: integer, required, min 0
  - `unlearnedCount`: integer, required, min 0
  - `streakDays`: integer, required, min 0
- Derived from:
  - `todayDueCount`: `cards.nextReviewAt <= endOfTodayUtc`
  - `overdueCount`: `cards.nextReviewAt < startOfTodayUtc`
  - `unlearnedCount`: `cards.proficiency = 0`
  - `streakDays`: `review_sessions.status = completed` かつ `completedAt` を日単位で連続集計
- Validation:
  - `overdueCount <= todayDueCount`
  - 4 指標は常に存在し、省略しない

## 3. RecentActivity

- Purpose: ホーム画面に表示する主要イベントの要約。
- Fields:
  - `id`: string, required
  - `type`: enum, required
    - `review_completed`
    - `review_started`
    - `card_created`
  - `occurredAt`: string, ISO 8601, required
  - `label`: string, required, max 80 文字を目安
  - `count`: integer | null, optional
- Validation:
  - 配列は最大 3 件
  - `label` は画面表示向け短文とし、カード本文や回答を含めない
  - `count` は件数が意味を持つイベントでのみ設定する

## 4. HomeViewState

- Purpose: 通常 / 初回利用 / 今日の復習なしの正常系分岐を UI に明示する。
- Fields:
  - `firstUse`: boolean, required
  - `noReviewToday`: boolean, required
- Validation:
  - `firstUse = true` のとき、学習カード総数は 0 件であること
  - `firstUse = true` のときは `noReviewToday = true` を許容する
  - `firstUse = false` かつ `todayDueCount = 0` のとき `noReviewToday = true`

## 5. HomePrimaryAction

- Purpose: ホームから移動できる固定導線。
- Fields:
  - `kind`: enum
    - `start_review_today`
    - `open_cards`
    - `create_card`
    - `open_settings`
  - `label`: string
  - `target`: string
- Validation:
  - `start_review_today` は `POST /api/review/start` に `filter = today` を渡した後、`/review?sessionId=...` へ遷移する
  - その他の target は既存 top-level route と一致する

## State Transitions

```text
loading
  -> ready          : API 取得成功かつ firstUse=false かつ noReviewToday=false
  -> first-use      : API 取得成功かつ state.firstUse=true
  -> no-review      : API 取得成功かつ state.firstUse=false かつ state.noReviewToday=true
  -> error          : API 取得失敗

ready / first-use / no-review / error
  -> loading        : ユーザが再試行または画面再訪問
```

## Relationships

- `HomeDashboardResponse.summary` は 1:1 で `HomeSummary` を持つ
- `HomeDashboardResponse.state` は 1:1 で `HomeViewState` を持つ
- `HomeDashboardResponse.recentActivities` は 0..3 件の `RecentActivity` を持つ
- `HomePrimaryAction` は API レスポンスではなく UI 側の固定定義だが、`HomeViewState` に応じて強調順だけが変わる