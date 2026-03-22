# research.md

## Session persistence strategy

- Decision: review session は PostgreSQL に永続化し、Prisma で ReviewSession / ReviewSessionCard を管理する。
- Rationale: spec では離脱後の同一 session 再開、現在位置の復元、評価の固定が必須であり、Express のメモリ保持や client-only state では再読み込みやプロセス再起動に耐えられない。サーバ側永続化なら正確性と継続性の両方を満たせる。
- Alternatives considered: localStorage のみで session 全体を保持する案、Node プロセス内メモリで保持する案。いずれも信頼性が低く、再開条件と評価ロックの一貫性を保証できないため不採用。

## Review API shape

- Decision: /api/review/start を session 作成エンドポイントとして維持しつつ、session snapshot を返す GET /api/review/sessions/{sessionId}、評価更新 PUT /api/review/sessions/{sessionId}/assessment、前後移動 POST /api/review/sessions/{sessionId}/navigation を追加する。
- Rationale: 画面が必要とする状態は「現在カード + 進捗 + summary + filter summary」の snapshot であり、画面側で複数 API の結果を合成するよりも、サーバで不変条件を判定したうえで snapshot を返す方が単純で正確。navigation を明示 API にすることで assessment-before-next を 409 で強制できる。
- Alternatives considered: 1 本の万能 PATCH エンドポイントで session 全体を更新する案、GraphQL 化する案。責務が曖昧になり、テスト分岐も増えるため不採用。

## Resume locator strategy

- Decision: frontend は開始時に /review?sessionId=... へ遷移し、最後に開いていた進行中 sessionId を browser storage に保存して、復習画面へ直接戻ったときの resume に使う。
- Rationale: 認証ユーザーの概念がまだ存在しないため、「誰の active session か」を backend だけで解決できない。URL に sessionId を持たせれば共有可能性とデバッグ性が高く、browser storage を併用すればナビゲーションバー経由の再訪にも対応できる。
- Alternatives considered: active session を backend が 1 件だけ返す案、グローバル singleton session 案。複数タブや将来のマルチユーザー化に弱いため不採用。

## Assessment locking rule

- Decision: 自己評価は current card に留まっている間だけ最新値で上書き可能とし、next へ進んだ時点で locked にする。prev で戻っても locked card は再編集不可とする。
- Rationale: clarify で確定した仕様をサーバ側で明示的に守る必要がある。lock 時点を navigation success に揃えると、current card の編集可否が単純な状態遷移で表現できる。
- Alternatives considered: assessment 即時確定案、完了前ならいつでも再編集可能案。前者は誤操作耐性が低く、後者は summary と progress の意味が揺らぐため不採用。

## Card content loading model

- Decision: session には cardId と評価メタデータのみを保持し、表示する card 本文や answer、tag は Card テーブルから live に取得する。
- Rationale: 現行 Prisma スキーマは Card を正本としており、review 用の全文スナップショットを複製するとデータ重複と migration コストが増える。現スコープでは session 一貫性よりも最小データと既存モデル活用を優先する。
- Alternatives considered: session 開始時にカード本文と回答を複製保存する案。編集競合には強いが、Privacy & Minimal Data と実装コストの両面で過剰なため不採用。

## Filter summary rendering

- Decision: review session snapshot は query/filter/tagLabels/collectionLabels/sort から成る filter summary を保持して返す。tag と collection の表示名は session 作成時に backend が解決する。
- Rationale: spec では「どの条件で session を始めたか」の表示が必要であり、ID だけでは UI 要件を満たせない。backend で表示名を確定すれば resume 時に frontend の一時 state に依存せず再描画できる。
- Alternatives considered: frontend が labels を start request に同梱する案。client 依存の表示文字列を正本にすると説明可能性と一貫性が下がるため不採用。

## Frontend state ownership

- Decision: Review.tsx を page-owned orchestrator とし、answerVisible や keyboard shortcut handling、error / loading / completion state をページが保持する。UI 部品は presentational に留める。
- Rationale: CardList.tsx も現在 page-owned orchestration を採用しており、review でも snapshot 取得、assessment submit、navigation、resume をまとめて制御する方が既存構成と整合する。
- Alternatives considered: React Context や外部 state 管理ライブラリの導入。feature スコープに対して過剰であり、既存コードスタイルからも外れるため不採用。

## Test strategy

- Decision: backend は Supertest + Vitest で session start / resume / assessment / navigation / error branches を網羅し、frontend は Testing Library で review page state machine を検証し、Playwright で card list から review completion までの主要導線を追加する。
- Rationale: test.md は branch coverage と boundary / failure case を要求している。review screen は業務ルールが多いため、API と画面の両方で自動テストを置く必要がある。
- Alternatives considered: backend contract test のみ、または E2E のみ。どちらも原因切り分けが弱く、DoD を満たさないため不採用。
