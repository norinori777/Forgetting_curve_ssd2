# research.md

## Runtime and repository strategy

- Decision: 既存の TypeScript + Node.js 18+ モノレポ構成を維持し、frontend / backend の責務分離を崩さない。
- Rationale: 登録画面、create API、Prisma schema、Vitest / Playwright がすでに同一 repo で揃っており、追加のサブシステムを増やす必要がない。
- Alternatives considered: 別サービスや別フォームモジュールへの切り出し。今回の差分は既存 create-card フローへの拡張であり、分離コストに見合わないため不採用。

## Answer persistence scope

- Decision: この feature で create UI だけでなく、`Card.answer` の永続化経路も同時に追加する。
- Rationale: main 時点の `prisma/schema.prisma`、create request schema、create response には answer が存在しないため、入力欄だけでは feature が成立しない。登録体験を完結させるには DB / API / UI を一括で更新する必要がある。
- Alternatives considered: 回答入力欄だけ先行実装して保存は別 feature に分離する。UI と保存結果が乖離し、ユーザー価値を提供できないため不採用。

## Empty-answer normalization

- Decision: 回答が未入力または空白のみの場合は `null` と同義の未登録として保存する。
- Rationale: clarified spec で確定しており、空文字と `null` の二重表現を避けると一覧表示、将来の検索、更新 API の整合が取りやすい。
- Alternatives considered: 空文字をそのまま保存する、空白のみを別扱いにする。後続 feature で条件分岐が増えるため不採用。

## Multiline input strategy

- Decision: 回答入力は `textarea` とし、入力中・プレビュー・保存後とも改行を保持する。
- Rationale: clarified spec で複数行入力が必要であり、既存の `content` 入力欄も `textarea` を使っているため実装と UX の一貫性が高い。
- Alternatives considered: 単一行 input + 区切り記号利用。長文回答との相性が悪く不採用。

## Preview rendering rule

- Decision: 登録前プレビューでは回答を全文表示し、省略しない。
- Rationale: clarified spec で確定しており、登録画面のプレビューは入力確認のための領域であるため、一覧のような情報密度制約より確認性を優先すべきである。
- Alternatives considered: 先頭数行のみ表示、回答をプレビュー対象外にする。複数行回答の誤登録検知が弱くなるため不採用。

## Frontend draft ownership

- Decision: 回答欄の値、正規化前後の状態、submit failure 時の保持は既存 `CardCreateDraft` に追加してページ所有のまま扱う。
- Rationale: `CardCreate.tsx` が現在も draft 保存、beforeunload、submit state、field error を統合管理しており、同じ責務境界に answer を載せるのが最小変更である。
- Alternatives considered: 回答だけ別 state や別 localStorage key で管理する。整合性が崩れやすく不採用。

## Backend validation rule

- Decision: create request schema では `answer` を optional な string として受け取り、repository 手前で trim 判定して空白のみを `null` に正規化する。
- Rationale: API は複数行 text を受け取る必要がある一方、空白のみかどうかの意味判定はドメインルールであり、repository 直前または request 変換時に集中させると扱いやすい。
- Alternatives considered: Zod transform で即 `null` に変換する。実装可能だが、frontend / backend で同一正規化規則を共有しづらいため今回はドメイン変換側に寄せる。

## API contract surface

- Decision: 外部契約変更は `POST /api/cards` の request / response 拡張に限定し、answer を nullable string として追加する。
- Rationale: この feature は作成フロー拡張が目的であり、一覧表示や検索 API の変更は別 feature に委ねる方が責務が明確になる。
- Alternatives considered: list API や update API まで同時拡張する。機能要求を超えて変更面積が増えるため不採用。

## Message catalog strategy

- Decision: 新規メッセージ追加は必要最小限に留め、既存の成功・失敗・補助文言を再利用し、回答専用メッセージは本当に新規の説明が必要な場合だけ `docs/messages.md` に追加する。
- Rationale: 回答欄は任意であり、必須バリデーションや専用エラーを増やさないため、既存の create-card メッセージ体系を崩す必要がない。
- Alternatives considered: 回答用に専用 validation / helper メッセージを多数追加する。UI 複雑性だけが増えるため不採用。

## Local database sync strategy

- Decision: ローカル開発では `prisma migrate dev` ではなく `prisma db push` を基準手順とする。
- Rationale: この repo は historical baseline migration を持たず、shadow DB を使う migration workflow が安定しないことを確認済みである。開発検証では schema 同期を優先する。
- Alternatives considered: 毎回 migration を基準にする。現状 repo では失敗しやすく、plan の再現性が落ちるため不採用。