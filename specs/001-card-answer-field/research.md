# research.md

## Runtime and repository strategy

- Decision: 既存の TypeScript + Node.js 18+ モノレポ構成を維持し、backend と frontend の責務分離を崩さない。
- Rationale: ルート workspace に Vitest、Playwright、Prisma、Storybook が揃っており、今回の変更はカード一覧と API 契約の拡張で完結する。
- Alternatives considered: 新しい状態管理基盤や別 API 層の導入。今回の feature では変更面積が増えるだけで価値が薄いため不採用。

## Answer persistence model

- Decision: `Card` に nullable な `answer` フィールドを追加し、複数行のプレーンテキストを PostgreSQL の text 列として保持する。
- Rationale: spec では回答はカードごとに 1 つ、任意、複数行プレーンテキストである。既存の `Card.content` と同じ Prisma / PostgreSQL の扱いに寄せると migration と API 契約の変更が最小で済む。
- Alternatives considered: 別テーブルで `Answer` を分離する。将来の履歴管理には向くが、今回の読み取り専用スコープに対して過剰で join と型更新が増えるため不採用。

## Answer display preference source

- Decision: 回答表示設定は、今回に限りクライアントローカルの read-only preference として扱い、`fc.cardList.answerDisplayMode` キーから `link` または `inline` を読む。未設定・不正値は `link` にフォールバックする。
- Rationale: 現在のコードベースには設定テーブル、設定 API、localStorage 利用、設定コンテキストのいずれも存在しない一方、spec では設定画面 UI を今回スコープ外にしている。ローカル設定読み取りサービスなら最小追加で要件を満たし、将来の設定画面から同じキーへ接続できる。
- Alternatives considered: 新規 `/api/settings` を追加する。将来性は高いが、今回の feature で DB / API / UI を同時に増やすとスコープが広がりすぎるため不採用。

## Card list search expansion

- Decision: 既存の `q` 検索は title / content に加えて answer も対象に含める。
- Rationale: spec で確定した振る舞いであり、現在の検索実装は `buildCardBaseFilters()` の OR 条件を拡張するだけで実現できる。UI 側の検索導線や query schema を変える必要がない。
- Alternatives considered: 回答検索を別クエリパラメータに分離する。ユーザー価値の割に UI と API 契約が複雑になり、検索導線も分断されるため不採用。

## API contract surface

- Decision: 外部契約の変更対象は `/api/cards` のみとし、`Card` schema に nullable `answer` を追加し、`q` の説明を title / content / answer 対象へ更新する。
- Rationale: 回答登録 UI も設定 API も今回のスコープ外であり、既存一覧 API のレスポンス拡張だけで frontend の必要情報を満たせる。検索の入力 schema も既存の `q` のまま再利用できる。
- Alternatives considered: 回答取得専用 endpoint を追加する。1 画面内の表示切替に対して API 数が増え、即時性も落ちるため不採用。

## UI state ownership for answer visibility

- Decision: カード単位の回答表示状態は `frontend/src/pages/CardList.tsx` で `cardId` keyed state として保持し、`CardItem.tsx` は props に従って表示のみを行う。
- Rationale: 現在も CardList が検索、絞り込み、選択、モーダル開閉などの一覧統合状態を所有している。回答表示も同じページ状態に置くと、再取得や query change 時の初期化規則を一箇所で管理できる。
- Alternatives considered: `CardItem.tsx` 内部 state や global store の導入。内部 state は再取得時の既定表示との整合が取りづらく、global store は今回のスコープに対して過剰なため不採用。

## Long-answer presentation rule

- Decision: `inline` 表示時も一覧では回答を最大数行までに制限し、超過分は省略表示する。
- Rationale: spec で長文回答でも一覧性を守る必要がある。既存 `CardItem.tsx` は本文をそのまま描画しているため、回答表示だけを局所的に制御する方が既存 layout への影響が少ない。
- Alternatives considered: 全文表示、先頭 1 行固定、詳細モーダル。全文は一覧性を崩し、1 行固定は複数行回答との相性が悪く、モーダルは clarified spec の「リンクが回答に置き換わる」と一致しないため不採用。

## Test coverage focus

- Decision: 自動テストは API 契約回帰、検索条件分岐、表示設定フォールバック、カード単位の回答表示切替、長文省略表示を重点対象にする。
- Rationale: `test.md` では branch coverage と boundary coverage が必須であり、今回増える分岐は answer nullability、検索 OR 条件、設定値の正当性、表示モード切替である。
- Alternatives considered: 手動確認のみ。既存一覧機能への回帰検知が不十分なため不採用。