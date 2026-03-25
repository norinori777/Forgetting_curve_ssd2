# Data Model: Search Results Review Start

## 1. SearchResultFilter

一覧画面で利用者が設定した現在の検索条件を表す入力モデル。review start の唯一の入力ソースであり、フロントエンドとバックエンドの双方で同じ意味を持つ。

| Field | Type | Required | Description | Validation |
| --- | --- | --- | --- | --- |
| `q` | string \| null | No | タイトル / 本文 / 回答 / タグ相当の検索語 | trim 後に空文字なら `null` 扱い |
| `filter` | `today \| overdue \| unlearned \| null` | No | 単一選択のステータスフィルタ | 定義済み enum のみ |
| `sort` | `next_review_at \| proficiency \| created_at` | Yes | 安定順序で review target set を解決するソートキー | 未指定不可 |
| `tagIds` | string[] | Yes | タグ絞り込みの対象 ID 群 | 配列。重複は正規化してもよい |
| `collectionIds` | string[] | Yes | コレクション絞り込みの対象 ID 群 | 配列。重複は正規化してもよい |

### SearchResultFilter Rules

- `SearchResultFilter` は一覧の現在状態を表すスナップショットであり、review start 直前に確定する
- `sort` は review target set の順序にもそのまま使う
- `tagIds` / `collectionIds` はラベル表示用に開始時に解決されるが、session 永続化では filter summary の最小情報だけを保持する

## 2. ReviewTargetSet

`SearchResultFilter` から導出される、開始時点で確定した順序付きカード集合。永続化上は `ReviewSession` と `ReviewSessionCard` に分解されるが、設計上は検索結果から復習開始へ橋渡しする派生モデルとして扱う。

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `orderedCardIds` | string[] | Yes | 利用可能かつ session に含めるカード ID を sort 順で並べた配列 |
| `matchedCount` | number | Yes | 開始時点の検索条件に一致した候補件数 |
| `includedCount` | number | Yes | `orderedCardIds.length` |
| `excludedCount` | number | Yes | `matchedCount` から除外された総件数 |
| `maxReviewStartCount` | number | Yes | 復習開始で採用する上限件数。固定値 200 |
| `exclusionBreakdown` | `ReviewTargetExclusion[]` | Yes | 除外理由ごとの件数内訳 |
| `resolvedAt` | datetime | Yes | 対象集合を確定した時刻 |
| `sourceFilter` | SearchResultFilter | Yes | 対象集合を導いた開始条件 |

### ReviewTargetSet Rules

- `orderedCardIds` は session に含める最終対象だけを持つ
- `matchedCount` は開始時点の検索条件に一致した候補件数であり、`includedCount + excludedCount` に一致する
- `orderedCardIds` は server-side resolver が DB 状態から決定する
- `matchedCount > 200` の場合、安定順序で先頭 200 件までを採用し、残りは `over_limit` として除外する
- resolver 実行から session 作成までの間に利用不能になったカードは `unavailable` として除外する
- `includedCount` が 0 件なら session は作成しない
- session 作成後は `ReviewTargetSet` を再計算しない

## 3. ReviewSession

既存 DB モデルを再利用する中核エンティティ。検索結果から開始された復習の進行状態を保持する。

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | UUID | Yes | session 識別子 |
| `status` | `in_progress \| completed` | Yes | 進行状態 |
| `currentCardIndex` | number | Yes | 現在表示中カードのインデックス |
| `totalCards` | number | Yes | 開始時に確定した対象カード数 |
| `sourceQuery` | string \| null | No | 検索語の記録 |
| `sourceFilter` | `today \| overdue \| unlearned \| null` | No | ステータスフィルタの記録 |
| `sourceSort` | sort enum | Yes | 対象解決時に使用したソート |
| `sourceTagLabels` | string[] | Yes | 開始時に解決したタグラベル |
| `sourceCollectionLabels` | string[] | Yes | 開始時に解決したコレクションラベル |
| `createdAt` | datetime | Yes | session 作成時刻 |
| `completedAt` | datetime \| null | No | 完了時刻 |

### ReviewSession Rules

- `totalCards` は開始時に固定される
- `source*` フィールドは Review 画面で filter summary を表示するための監査情報として使う
- `currentCardIndex` は `ReviewSessionCard.orderIndex` を指す

## 4. ReviewTargetExclusion

復習開始時に対象から除外された件数の理由内訳を表す補助モデル。Review 画面で開始時の説明を継続表示するために使う。

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `reason` | `over_limit \| unavailable` | Yes | 除外理由 |
| `count` | number | Yes | 当該理由で除外された件数 |

### ReviewTargetExclusion Rules

- `count` は 1 以上の整数
- `over_limit` は 200 件上限を超えたため含めなかった件数を表す
- `unavailable` は候補解決後に利用不能と判定され、session に含められなかった件数を表す

## 5. ReviewSessionCard

`ReviewSession` に属する順序付き対象カード。既存モデルを再利用する。

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `sessionId` | UUID | Yes | 親 session |
| `cardId` | UUID | Yes | 対象カード |
| `orderIndex` | number | Yes | 開始時点の順序 |
| `assessment` | `forgot \| uncertain \| remembered \| perfect \| null` | No | 現在の自己評価 |
| `assessedAt` | datetime \| null | No | 評価記録時刻 |
| `lockedAt` | datetime \| null | No | 次へ進んだ後に固定された時刻 |

### ReviewSessionCard Rules

- `(sessionId, cardId)` は一意
- `(sessionId, orderIndex)` も一意
- `lockedAt` が設定されたカードの評価は変更しない
- Review 画面に表示されるカードは現在の `orderIndex` に一致する 1 件のみ

## 6. ReviewSessionSnapshot

Review 画面へ返す読み取りモデル。既存 API 契約を踏襲する。

| Field | Type | Description |
| --- | --- | --- |
| `sessionId` | UUID | 現在の session |
| `status` | enum | `in_progress` または `completed` |
| `currentIndex` | number | 現在位置 |
| `totalCount` | number | 全対象件数 |
| `remainingCount` | number | 未完了件数 |
| `canGoPrev` | boolean | 前移動可否 |
| `canGoNext` | boolean | 次移動可否 |
| `filterSummary` | object | 開始条件要約 |
| `currentCard` | object \| null | 現在表示中のカード |
| `summary` | object | 評価別集計 |

### ReviewSessionSnapshot Rules

- `currentCard` は `status = completed` のとき `null`
- `filterSummary` は開始時点の `SearchResultFilter` と label 解決結果、必要に応じて `targetResolution` を含む
- `currentCard` は `ReviewTargetSet` に含まれるカード以外を返さない

## 7. ReviewTargetResolution

Review 画面に表示する開始時点の対象確定結果の要約。`ReviewSessionSnapshot.filterSummary.targetResolution` として保持する。

| Field | Type | Description |
| --- | --- | --- |
| `matchedCount` | number | 開始時点の検索条件に一致した候補件数 |
| `includedCount` | number | session に採用された件数 |
| `excludedCount` | number | 除外された総件数 |
| `exclusionBreakdown` | `ReviewTargetExclusion[]` | 除外理由ごとの件数内訳 |

### ReviewTargetResolution Rules

- `excludedCount = 0` のとき `exclusionBreakdown` は空配列でよい
- `matchedCount > includedCount` のとき、Review 画面は `exclusionBreakdown` を使って開始時の注意文を表示できる
- `ReviewTargetResolution` は session 固定情報であり、navigation や resume でも変化しない

## Relationships

- `SearchResultFilter` 1 件から 0 または 1 つの `ReviewTargetSet` が導出される
- `ReviewTargetSet` 1 件から 1 つの `ReviewSession` が作られる
- `ReviewSession` 1 件は 1..N の `ReviewSessionCard` を持つ
- `ReviewSessionSnapshot` は `ReviewSession`、現在の `ReviewSessionCard`、`ReviewTargetResolution` から派生する

## State Transitions

```text
SearchResultFilter entered
  -> ReviewTargetSet resolved
    -> [0 cards] StartRejected(empty)
    -> [1+ cards] ReviewSession created
      -> in_progress
        -> next / prev navigation within ordered cards
        -> final card completed
      -> completed
```

## Validation and Boundary Cases

- 検索条件変更直後に start しても、resolver 実行時点の最新 `SearchResultFilter` を使う
- `ReviewTargetSet` はページング済み一覧件数に依存しない
- 検索結果 1 件でも `ReviewSession.totalCards = 1` で正常開始する
- 検索結果 0 件では `ReviewSession` を作成しない
- 検索結果が 200 件を超える場合でも、`ReviewTargetSet.orderedCardIds` は 200 件までに制限され、超過件数は `over_limit` として `ReviewTargetResolution` に残す
- 利用不能カードが発生した場合は `unavailable` として `ReviewTargetResolution` に残し、利用可能カードが 1 件以上あれば session を作成する
- 開始後に一覧画面側の検索条件やカード表示件数が変わっても、既存 `ReviewSession` の `ReviewSessionCard` は変化しない
