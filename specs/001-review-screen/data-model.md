# data-model.md

## エンティティ

### ReviewSession

- Purpose: 1 回の復習実行を表す session 本体。現在位置、開始条件要約、完了状態を保持する。
- Fields:
  - id (UUID)
  - status (`in_progress` | `completed` | `abandoned`)
  - currentCardIndex (int, 0-based)
  - totalCards (int)
  - remainingCards (int, derived)
  - sourceQuery (string | null)
  - sourceFilter (`today` | `overdue` | `unlearned` | null)
  - sourceSort (`next_review_at` | `proficiency` | `created_at`)
  - sourceTagLabels (string[])
  - sourceCollectionLabels (string[])
  - createdAt (datetime)
  - updatedAt (datetime)
  - completedAt (datetime | null)
- Relationships:
  - 1 --- N ReviewSessionCard
- Validation rules:
  - totalCards >= 0
  - currentCardIndex は `0 <= index < totalCards` を満たすか、completed 時は totalCards と等しい
  - completedAt は status = completed のときのみ設定される
- State transitions:
  - `in_progress` -> `completed`: 最後の card まで評価し、next を確定したとき
  - `in_progress` -> `abandoned`: 将来の明示破棄機能で使用可能。今回の MVP では通常遷移させない

### ReviewSessionCard

- Purpose: session 内の各 card の順序と評価状態を保持する join エンティティ。
- Fields:
  - sessionId (UUID)
  - cardId (UUID)
  - orderIndex (int)
  - assessment (`forgot` | `uncertain` | `remembered` | `perfect` | null)
  - assessedAt (datetime | null)
  - lockedAt (datetime | null)
- Relationships:
  - N --- 1 ReviewSession
  - N --- 1 Card
- Validation rules:
  - `(sessionId, cardId)` は一意
  - `orderIndex` は session ごとに一意
  - `lockedAt` が設定された row は再編集不可
- State transitions:
  - `Unassessed` -> `DraftAssessed`: current card 上で評価が保存された状態
  - `DraftAssessed` -> `Locked`: next navigation 成功時

### ReviewCardSnapshot

- Purpose: frontend が現在カード表示に使う読み取り専用 DTO。DB の Card と ReviewSessionCard を結合して生成する。
- Fields:
  - cardId (UUID)
  - title (string)
  - content (text)
  - answer (text | null)
  - tags (string[])
  - collectionLabel (string | null)
  - nextReviewAt (datetime)
  - reviewReason (ReviewReason)
  - currentAssessment (`forgot` | `uncertain` | `remembered` | `perfect` | null)
  - locked (boolean)
- Validation rules:
  - answer は初期表示では返してよいが、UI は表示制御を client 側で行う
  - reviewReason は nextReviewAt、期限超過状態、開始条件要約、明示選択のいずれか既存情報から構成する
  - locked = true の card は assessment 更新 API で変更不可

### ReviewReason

- Purpose: 学習者に「なぜ今このカードを復習するのか」を簡潔に説明する補助 DTO。
- Fields:
  - label (string)
  - detail (string | null)
  - source (`next_review_at` | `overdue` | `filter_match` | `unlearned` | `manual_selection` | null)
- Validation rules:
  - label は空文字不可
  - detail は表示可能な既存情報がある場合のみ付与する

### CachedReviewSessionSnapshot

- Purpose: 一時的な通信失敗時に frontend が継続表示するためのローカル保存モデル。
- Fields:
  - sessionId (UUID)
  - snapshot (ReviewSessionSnapshot)
  - cachedAt (datetime)
- Validation rules:
  - 同一 sessionId では最新 snapshot だけを保持する
  - completed session の cache は再開用ではなく閲覧補助として扱う

### PendingReviewAssessment

- Purpose: assessment 保存失敗時に再送待ちとして保持する client-only モデル。
- Fields:
  - sessionId (UUID)
  - cardId (UUID)
  - assessment (`forgot` | `uncertain` | `remembered` | `perfect`)
  - queuedAt (datetime)
  - basedOnIndex (int)
- Validation rules:
  - 同一 sessionId と cardId の pending item は 1 件だけ保持し、最新選択で上書きする
  - locked 済み card や currentIndex が進んだ card には再送しない

### ReviewFilterSummary

- Purpose: session 開始条件を UI に説明するための要約情報。
- Fields:
  - q (string | null)
  - filter (`today` | `overdue` | `unlearned` | null)
  - sort (`next_review_at` | `proficiency` | `created_at`)
  - tagLabels (string[])
  - collectionLabels (string[])
- Validation rules:
  - 表示用要約であり card 抽出の再計算ロジックそのものではない

### ReviewSessionSummary

- Purpose: 完了時と進行中の集計表示に使う評価別件数。
- Fields:
  - forgotCount (int)
  - uncertainCount (int)
  - rememberedCount (int)
  - perfectCount (int)
  - assessedCount (int)
  - totalCount (int)
- Validation rules:
  - 各 count は 0 以上
  - 各評価 count の合計は assessedCount と一致する

## 入出力モデル

### ReviewSessionSnapshot

- Purpose: review page の描画に必要な 1 回分の API レスポンス。
- Fields:
  - sessionId (UUID)
  - status (`in_progress` | `completed`)
  - currentIndex (int)
  - totalCount (int)
  - remainingCount (int)
  - canGoPrev (boolean)
  - canGoNext (boolean)
  - filterSummary (ReviewFilterSummary)
  - currentCard (ReviewCardSnapshot | null)
  - summary (ReviewSessionSummary)
- Invariants:
  - status = completed のとき currentCard = null
  - canGoNext = false かつ currentCard != null の場合でも、完了前は「未評価で進めない」ケースがある
  - currentCard != null の場合、reviewReason が必ず存在する

### StartReviewRequest

- Source: 既存 /api/review/start を拡張
- Fields:
  - filter (CardListFilter | undefined)
  - cardIds (string[] | undefined)
- Validation rules:
  - `cardIds` または `filter` のどちらかが必須
  - カード一覧画面からは `filter` を正本として送る

### StartReviewResponse

- Decision: 既存 response を session snapshot に置き換える
- Fields:
  - snapshot (ReviewSessionSnapshot)
- Compatibility note:
  - 既存の `sessionId` + `cardIds` だけでは review screen の resume と進捗表示が不十分なため、snapshot 返却へ更新する

### UpdateAssessmentRequest

- Fields:
  - cardId (UUID)
  - assessment (`forgot` | `uncertain` | `remembered` | `perfect`)
- Validation rules:
  - current card と一致する cardId でなければ 409
  - locked 済み card なら 409

### NavigateReviewRequest

- Fields:
  - direction (`prev` | `next`)
- Validation rules:
  - `next` のとき current card に assessment が必須
  - `prev` は index 0 のとき no-op snapshot を返す

## リレーション

- ReviewSession 1 --- N ReviewSessionCard
- ReviewSessionCard N --- 1 Card
- ReviewSession 1 --- 1 ReviewFilterSummary (embedded fields)
- ReviewSession 1 --- 1 ReviewSessionSummary (derived)

## インデックス / 永続化設計

- ReviewSession: primary key `id`, secondary index `(status, updatedAt)`
- ReviewSessionCard: unique `(sessionId, orderIndex)`, unique `(sessionId, cardId)`, index `(sessionId, lockedAt)`
- Card の既存 primary/index を join に再利用する

## 実装上の不変条件

- answerVisible は client-only state とし、session snapshot には永続化しない
- current card の評価は next 成功までは最新値で上書きできる
- next が成功した瞬間に直前 card は locked になり、prev で戻っても再編集できない
- session resume は sessionId をキーに snapshot を再取得することで実現する
- snapshot 取得または navigation が一時失敗した場合でも、最後に成功した CachedReviewSessionSnapshot を表示して再試行できる
- assessment 保存が一時失敗した場合、PendingReviewAssessment をローカル保持し、同一 card が未 lock の間だけ再送対象とする
- completed session は完了サマリだけを返し、currentCard は返さない
