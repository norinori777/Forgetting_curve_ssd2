# Research: 統計画面 ASCII UI デザイン

## Decision 1: 統計データは専用 `GET /api/stats?range=` で取得する

- Decision: `today | 7d | 30d | all` を query parameter に持つ専用 endpoint を追加し、summary・trend・tag breakdown・insights を 1 snapshot で返す。
- Rationale: 既存 `/api/home` はトップ画面向けの 4 指標に限定されており、統計画面で必要な前期間比、時系列、タグ別集計をクライアント側で合成するとリクエスト数と整合性コストが増える。専用 endpoint に集約する方が Accuracy と Continuity の両方に合う。
- Alternatives considered:
  - `/api/home` を拡張する: ホームと統計の責務が混ざり、payload が肥大化するため却下。
  - `/api/cards` と `/api/review/*` をクライアントで複数回呼ぶ: 不要な詳細データを取得しやすく、期間切り替え時の整合性も崩れやすいため却下。

## Decision 2: 期間粒度は `today=hourly`, `7d/30d=daily`, `all=monthly` にする

- Decision: 選択期間に応じて trend bucket を切り替え、`today` は時間単位、`7d` と `30d` は日単位、`all` は月単位で返す。
- Rationale: 同一粒度固定だと `today` は 1 点だけ、`all` は点数が多すぎる。期間に応じて粒度を切り替える方が UI 幅に収まり、ASCII UI の見た目にも合わせやすい。
- Alternatives considered:
  - 全期間を日単位で返す: 長期利用で点数が多すぎて可読性が落ちるため却下。
  - すべて月単位で返す: 7 日・30 日の短期変化が見えなくなるため却下。

## Decision 3: summary のレビュー完了数と平均正答率は `review_session_cards.assessed_at` を基準にする

- Decision: `completedReviewCount` は選択期間内に `assessedAt` が記録された回答件数、`averageAccuracy` は同期間内の回答だけを母集団に計算する。正答率の重みは `forgot=0`, `uncertain=50`, `remembered=100`, `perfect=100` を採用する。
- Rationale: user clarification で平均正答率の母集団は「選択中期間内のレビュー回答」と確定済み。`assessedAt` 基準ならレビューセッション完了有無に依存せず、1 日に 1 回以上レビューしたかという streak 定義とも整合する。`uncertain` を 50 点扱いにすると、部分想起を表しつつ説明しやすい。
- Alternatives considered:
  - `review_sessions.completed_at` を基準にする: 回答済みだが未完了の session を取りこぼし、clarification の連続学習日数ともずれるため却下。
  - 4 段階に細かい重みを別途設ける: 説明が複雑になり、Explainability に反するため却下。

## Decision 4: タグ別内訳は選択期間内に回答されたカードをタグへ展開して集計する

- Decision: `review_session_cards` から対象 card を拾い、`card_tags` と `tags` を join してタグ別の回答件数と平均正答率を返す。複数タグを持つカードは所属する各タグに 1 回ずつ計上する。
- Rationale: clarification で内訳はタグ単位と確定済み。カードに複数タグがある現行データモデルでは、どのタグに弱さがあるかを見つける目的に対して multi-tag 展開が最も自然である。
- Alternatives considered:
  - 先頭タグだけに限定する: ルールが不自然で、学習内容の実態を欠くため却下。
  - コレクション単位へ置き換える: clarification と矛盾するため却下。

## Decision 5: 部分欠損は 200 レスポンスで `unavailableSections` を返し、全失敗だけ 503 にする

- Decision: 集計可能な summary と volume trend は返せるが accuracy 系だけ欠けるケースを `state.mode = partial` と `unavailableSections` で表現し、全体取得不能のみ `503 { error: 'stats_temporary_failure' }` を返す。
- Rationale: spec は「一部データ欠損」と「取得失敗」を別状態として求めている。200 + degraded payload なら frontend は利用可能部分を残して描画でき、Reliability と UX の両方を満たしやすい。
- Alternatives considered:
  - 部分欠損も 503 にする: 利用可能な統計まで失われるため却下。
  - 欠損情報を持たず null 値だけ返す: frontend が意図を判定しにくく、テストもしづらいため却下。

## Decision 6: インサイトは deterministic な 2 件を返す

- Decision: insight は最大 2 件に制限し、1 件目は前期間比に基づく全体傾向、2 件目はタグ別内訳の最弱タグに基づく改善提案を返す。
- Rationale: ASCII UI の information density に対して自由文を増やしすぎるとノイズになる。ルールベースで 2 件に絞れば Explainability を保ちながら、実装とテストも単純にできる。
- Alternatives considered:
  - LLM 的な自由文生成: 再現性が低く、テスト不能なため却下。
  - insight を返さない: FR-010 を満たせないため却下。

## Decision 7: frontend は既存 `/stats` を差し替え、共通 async UI を再利用する

- Decision: `frontend/src/pages/Stats.tsx` を本実装に差し替え、loading は `AsyncState`、error banner は `RetryBanner` を再利用し、stats 固有 UI だけを `components/uniqueParts` に追加する。
- Rationale: 既存 layout と async 表示規約に合わせる方が一貫性が高く、Storybook 追加もしやすい。
- Alternatives considered:
  - `Stats.tsx` にすべて直書きする: 画面が長くなり再利用性とテスト容易性が落ちるため却下。
  - 既存 home 部品を流用しすぎる: 意味の異なる UI を無理に共有すると責務が曖昧になるため却下。

## Decision 8: テストは backend 契約・frontend 状態表示・必要時 E2E の三層で行う

- Decision: backend に `tests/backend/stats.test.ts`、frontend に `tests/frontend/stats.test.tsx` を追加し、`test.md` に従って branch/boundary を満たす。E2E は `/stats` 表示と期間切り替え確認を必要に応じて追加する。
- Rationale: 集計ロジックと UI 状態分岐の責務が明確に分かれるため、backend と frontend を分離してテストする方が故障箇所を特定しやすい。
- Alternatives considered:
  - E2E のみで担保する: 境界値と部分欠損の検証が重すぎるため却下。
  - frontend のみをテストする: 集計正確性が担保できないため却下。
