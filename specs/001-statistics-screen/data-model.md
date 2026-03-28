# Data Model: 統計画面 ASCII UI デザイン

## 1. StatisticsDashboardResponse

- Purpose: `/stats` 初期表示および期間切り替え後に frontend が受け取る統計 snapshot。
- Fields:
  - `generatedAt`: string, ISO 8601, required
  - `selectedRange`: StatisticsRange, required
  - `summary`: StatisticsSummary, required
  - `volumeTrend`: TrendSeries, required
  - `accuracyTrend`: TrendSeries | null, optional
  - `tagBreakdown`: TagBreakdownItem[], required, length 0..5
  - `insights`: InsightItem[], required, length 0..2
  - `state`: StatisticsState, required
- Validation:
  - `selectedRange` は request query と一致すること
  - `generatedAt` は有効な日時文字列であること
  - `state.mode = empty` の場合、`completedReviewCount = 0` を満たすこと
  - `state.mode = partial` の場合、`unavailableSections.length >= 1`

## 2. StatisticsRange

- Purpose: 統計の集計対象期間を表す選択単位。
- Enum values:
  - `today`
  - `7d`
  - `30d`
  - `all`
- Validation:
  - API は上記 4 値のみ受け付ける
  - `today` は当日 UTC 00:00:00 から現在時刻まで、`7d` と `30d` は当日を含む直近日数、`all` は最初の回答記録から現在まで

## 3. StatisticsSummary

- Purpose: 画面上部の 4 KPI と補足情報を表す集計単位。
- Fields:
  - `totalCardCount`: SummaryMetric, required
  - `completedReviewCount`: SummaryMetric, required
  - `averageAccuracy`: SummaryMetric | null, optional
  - `streakDays`: StreakMetric, required
- Validation:
  - `totalCardCount.value >= 0`
  - `completedReviewCount.value >= 0`
  - `averageAccuracy.value` は 0..100 の数値または `null`
  - `streakDays.value >= 0`

## 4. SummaryMetric

- Purpose: KPI の現在値と前期間比を表す再利用単位。
- Fields:
  - `value`: number, required
  - `deltaFromPrevious`: number | null, optional
  - `unit`: enum(`count`, `percent`, `days`), required
  - `displayHint`: string | null, optional
- Validation:
  - `deltaFromPrevious` は同じ長さの直前期間との差分であること
  - `displayHint` は短い補足文に限定し、詳細説明は含めない

## 5. StreakMetric

- Purpose: 連続学習日数専用の補足情報を持つ KPI。
- Fields:
  - `value`: number, required
  - `deltaFromPrevious`: number | null, optional
  - `unit`: `days`, required
  - `bestRecordDays`: number | null, optional
  - `displayHint`: string | null, optional
- Validation:
  - `value` は `assessedAt` を持つ回答がある UTC 日を連続日数として数える
  - `bestRecordDays` は `value` 以上であることを許容する

## 6. TrendSeries

- Purpose: 学習量または正答率の時系列表示を表すグラフ用データ。
- Fields:
  - `metric`: enum(`completed_reviews`, `average_accuracy`), required
  - `bucketUnit`: enum(`hour`, `day`, `month`), required
  - `points`: TrendPoint[], required
- Validation:
  - `today=hour`, `7d/30d=day`, `all=month` を bucketUnit に使用する
  - `points` は期間順に昇順で返す
  - `average_accuracy` の `points[].value` は 0..100

## 7. TrendPoint

- Purpose: 単一 bucket の集計点。
- Fields:
  - `key`: string, required
  - `label`: string, required
  - `value`: number, required
  - `from`: string, ISO 8601, required
  - `to`: string, ISO 8601, required
- Validation:
  - `from <= to`
  - `label` は UI 表示用の短いテキストであること

## 8. TagBreakdownItem

- Purpose: タグ別の件数と平均正答率を示す内訳表示。
- Fields:
  - `tagId`: string, required
  - `tagName`: string, required
  - `reviewCount`: number, required, min 0
  - `averageAccuracy`: number | null, optional
  - `isWeakest`: boolean, required
- Validation:
  - 配列は最大 5 件
  - `isWeakest = true` は最大 1 件
  - 複数タグを持つカードは各タグに 1 件ずつ計上する

## 9. InsightItem

- Purpose: 次の学習行動を促す短い示唆文。
- Fields:
  - `id`: string, required
  - `kind`: enum(`trend`, `focus`), required
  - `message`: string, required
  - `relatedTagId`: string | null, optional
- Validation:
  - 配列は最大 2 件
  - `focus` insight は `relatedTagId` を持てる
  - `message` は表示用短文であり、生データ明細を含めない

## 10. StatisticsState

- Purpose: 通常表示・空状態・部分欠損を UI に伝える状態情報。
- Fields:
  - `mode`: enum(`ready`, `empty`, `partial`), required
  - `unavailableSections`: StatisticsSectionKey[], required
  - `message`: string | null, optional
- Validation:
  - `mode = ready` のとき `unavailableSections` は空配列
  - `mode = empty` のとき `completedReviewCount.value = 0`
  - `mode = partial` のとき `unavailableSections` は 1 件以上

## 11. StatisticsSectionKey

- Purpose: 部分欠損時に利用不能な領域を識別するキー。
- Enum values:
  - `accuracyTrend`
  - `tagBreakdown`
  - `insights`

## State Transitions

```text
loading
  -> ready    : API 取得成功かつ state.mode = ready
  -> empty    : API 取得成功かつ state.mode = empty
  -> partial  : API 取得成功かつ state.mode = partial
  -> error    : API 取得失敗 (503 など)

ready / empty / partial / error
  -> loading  : 期間切り替えまたは再試行
```

## Relationships

- `StatisticsDashboardResponse.summary` は 1:1 で `StatisticsSummary` を持つ
- `StatisticsDashboardResponse.volumeTrend` は 1:1 で `TrendSeries(metric=completed_reviews)` を持つ
- `StatisticsDashboardResponse.accuracyTrend` は 0..1 で `TrendSeries(metric=average_accuracy)` を持つ
- `StatisticsDashboardResponse.tagBreakdown` は 0..5 件の `TagBreakdownItem` を持つ
- `StatisticsDashboardResponse.insights` は 0..2 件の `InsightItem` を持つ
