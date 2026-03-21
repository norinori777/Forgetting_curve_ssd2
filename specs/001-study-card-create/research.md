# research.md

## Runtime and repository strategy

- Decision: frontend / backend ともに既存の TypeScript + Node.js 18+ モノレポ構成を維持する。
- Rationale: ルート `package.json` の workspace 構成、Vitest、Playwright、Prisma、Storybook が既にこの前提で揃っており、feature 追加だけで済む。
- Alternatives considered: 別アプリや別言語で登録画面を切り出す。CI と開発フローの分断が大きく不採用。

## Card creation route placement

- Decision: 学習カード登録ページは共通レイアウト配下の `/cards/create` で提供し、ヘッダーメニューにも独立導線として表示する。
- Rationale: 既存の `App.tsx` は `AppLayout` 配下で各ページを切り替える構成であり、カード一覧との関係性を保ちながら独立ページとして扱える。カード一覧右上の「新規カード」からも同じルートへ遷移できる。
- Alternatives considered: モーダルで登録する。PC/モバイル別レイアウトやプレビュー、未保存警告、成功後リダイレクトと相性が悪いため不採用。

## Navigation and breadcrumb resolution

- Decision: ヘッダーナビゲーションのページ定義は `topLevelPages` を拡張し、`/cards/create` が `/cards` より優先して解決されるようにする。
- Rationale: 現状の `resolveTopLevelPage()` は prefix 判定のため、単純追加では `/cards/create` が「カード一覧」として解決される。明示的な順序制御または厳密一致優先にして「学習カード登録」のパンくずを保つ必要がある。
- Alternatives considered: パンくずだけ個別実装で分岐する。ルーティング定義と表示定義が乖離しやすく不採用。

## Page-owned draft orchestration

- Decision: 登録画面の入力状態、送信状態、成功/失敗メッセージの制御は `CardCreate` ページで保持し、フォーム部品とプレビューは presentational に寄せる。
- Rationale: 既存の `CardList.tsx` もページが API 呼び出しと UI 状態を統合しており、この feature でも最小変更で一貫した構成を維持できる。
- Alternatives considered: Context やグローバル store の導入。今回の単一画面 feature には過剰で不採用。

## Backend mutation layering

- Decision: `POST /api/cards` を `backend/src/api/cards.ts` に追加し、入力検証は `backend/src/schemas/cards.ts`、永続化は `backend/src/repositories/cardRepository.ts` に分離する。
- Rationale: 既存の GET `/api/cards`、候補取得 API、bulk API も Zod + repository パターンを採用しており、同じ責務分割がもっとも回帰リスクが低い。
- Alternatives considered: route 内で Prisma を直接操作する。テストと分岐管理が難しくなるため不採用。

## Tag creation semantics

- Decision: タグ入力はカンマ区切りの tag name 配列として受け取り、未登録タグは Prisma `upsert` で作成してカードに紐づける。
- Rationale: spec で free-form tag 作成が確定しており、既存の `Tag.name` は unique 制約を持つため `upsert` が race condition を避けやすい。`card` と `card_tags` を同一トランザクションに含めれば整合性も保てる。
- Alternatives considered: 既存タグのみ選択可能にする。仕様に反するため不採用。

## Collection selection strategy

- Decision: コレクションは既存候補 API `GET /api/collections` を再利用して選択のみとし、作成画面では新規コレクション作成を行わない。
- Rationale: spec で既存候補のみが確定し、現在の backend は候補検索 API をすでに提供している。create-card feature の責務を増やさずに済む。
- Alternatives considered: コレクション自由入力/同時新規作成。入力検証、所有権、重複処理が増え、今回のスコープを超えるため不採用。

## Initial card values

- Decision: 新規カード作成時に `proficiency = 0`、`lastCorrectRate = 0`、`isArchived = false`、`nextReviewAt = now` を API 側で明示的に設定する。
- Rationale: Prisma schema 上はこれらに十分な default がなく、API 側で初期学習状態を補完しないと整合した新規カードが作れない。`nextReviewAt = now` は登録直後から学習対象にできる最小挙動で、継続性の原則とも整合する。
- Alternatives considered: DB default に依存する、または次回復習日時を未来にずらす。現在の schema と spec では根拠が弱く不採用。

## Message catalog strategy

- Decision: 具体的な成功・失敗・バリデーション・補助文言は repo 共通の `docs/messages.md` に集約し、見出し、ボタン名、ラベル、プレースホルダーは画面仕様側に残す。
- Rationale: spec で messages を別管理する方針が確定しており、共通利用可能な文言だけを集約することで過剰なテキスト抽出を避けられる。success/failure/help 文言は一覧復帰後の通知にも再利用しやすい。
- Alternatives considered: 全 UI 文言を messages 化する。画面構成仕様の可読性が落ち、変更コストが増えるため不採用。

## Success redirect behavior

- Decision: 登録成功後はカード一覧へ遷移し、成功メッセージを location state などの一過性状態で表示する。
- Rationale: spec で成功後の戻り先が確定しており、詳細画面が未定でもユーザーが作成結果を次の行動につなげやすい。既存の一覧画面を確認地点として再利用できる。
- Alternatives considered: 作成画面に留まる、確認画面へ遷移する。導線が増えて MVP の価値が下がるため不採用。

## Test strategy

- Decision: テストは backend contract test、frontend page/component test、Playwright による主要導線確認を追加し、`test.md` の branch / boundary 要件を守る。
- Rationale: 新規 mutation は入力分岐が多く、タグ upsert、必須項目不足、コレクション未選択、成功リダイレクトが主要分岐となる。フロントはナビゲーションと成功メッセージ表示まで含めて回帰確認が必要である。
- Alternatives considered: 手動確認のみ。既存挙動維持と憲法の Definition of Done を満たせないため不採用。