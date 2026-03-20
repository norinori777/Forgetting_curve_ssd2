# research.md

## Runtime and repository strategy

- Decision: frontend / backend ともに既存の TypeScript + Node.js 18+ モノレポ構成を維持する。
- Rationale: ルート `package.json` と workspace 構成が既に整っており、Vitest、Playwright、Prisma、Storybook もこの前提で揃っているため、最小変更で feature を拡張できる。
- Alternatives considered: 別言語や別ランタイムの導入。既存 CI と開発フローを崩すため不採用。

## Routing architecture for top-level pages

- Decision: frontend workspace に React Router DOM 6 系を追加し、`App.tsx` で共通レイアウト + トップレベルルート構成を持たせる。
- Rationale: clarified spec で `/`、`/cards`、`/review`、`/stats`、`/settings` の実ルートが必須になった。React 18 と相性がよく、共通ヘッダー・パンくず・フッターを維持しつつ本文だけを差し替える要件に合う。
- Alternatives considered: 独自 state による疑似ルーティング。URL 共有性とブラウザ履歴連携が弱く、spec の「実ルート」要件も満たしにくいため不採用。

## Card list orchestration remains page-owned

- Decision: 一覧の検索、絞り込み、選択、無限スクロール、復習開始、削除確認の状態は `frontend/src/pages/CardList.tsx` を中心に保持し、部品は presentational に寄せる。
- Rationale: 現在の実装は `CardList.tsx` が `queryKey`、`useSelection`、`IntersectionObserver`、モーダル開閉、API 呼び出しを一貫管理しており、ここを壊さずルーティングだけ外側に追加するのが最も安全。
- Alternatives considered: Zustand や Context への即時移行。今回のスコープでは再設計コストが大きく、既存挙動維持の制約に反するため不採用。

## Shared filter modal pattern

- Decision: タグとコレクションの絞り込みは、ラジオで対象を切り替える単一の `FilterSelectionModal` を継続利用する。
- Rationale: 現在の実装が `activeTarget`、`allowCollections`、`initialSelection` を持つ共用部品として成立しており、spec の FR-004a〜FR-004d と一致している。タグ一括付与/削除にも同一モーダルをタグ限定モードで再利用できる。
- Alternatives considered: タグ用とコレクション用の別モーダル。コードとテストの重複が増えるため不採用。

## Theme token source of truth

- Decision: デザイントークンの正本はリポジトリルートの `theme.json` とし、Tailwind theme extension へそのまま流し込む。
- Rationale: 実ファイルは root に存在し、`colors`、`fontFamily`、`fontSize`、`spacing`、`borderRadius`、`screens` が Tailwind に近い形で定義されている。直書き CSS を避ける要件とも整合する。
- Alternatives considered: CSS Modules や手書き CSS を併用する。トークン一貫性が崩れやすく不採用。

## API layering and validation

- Decision: HTTP 入力は `backend/src/schemas` の Zod で検証し、永続化は `backend/src/repositories/cardRepository.ts` に集中させる既存レイヤリングを維持する。
- Rationale: `listCardsQuerySchema`、`bulkRequestSchema`、`reviewStartRequestSchema` が既にあり、Prisma クエリも repository に閉じているため、設計上の責務分離が明確。
- Alternatives considered: route 内で直接 Prisma を呼ぶ。テストしづらく、分岐条件が散るため不採用。

## Cursor pagination contract

- Decision: 一覧 API は `nextCursor` を返すカーソル方式を維持し、カーソルは `sort` と比較値、`id` を base64url 化した opaque token とする。
- Rationale: `backend/src/schemas/cards.ts` に `CursorPayload`、`encodeCursor`、`decodeCursor` が既にあり、`query.sort` 不一致も検出できる。ソート変更時のカーソル無効化と相性がよい。
- Alternatives considered: オフセットページング。件数増加時の性能と安定性で劣るため不採用。

## Query-change behavior

- Decision: 検索、フィルタ、ソートの query key が変わった時点で、選択状態を全クリアし、一覧データは先頭から再取得する。
- Rationale: 現在の `CardList.tsx` は `queryKey` 依存の `useEffect` で `selection.clear()` と再取得を行っており、clarified spec の FR-007c と一致する。見えないカードへの誤操作を防げる。
- Alternatives considered: 表示内だけ選択維持、または全選択維持。バルク対象の可視性が下がり、誤操作リスクが高まるため不採用。

## Bulk action semantics

- Decision: バルクアーカイブは成功後に既定一覧から対象を除外し、タグ追加/削除は no-op を成功扱いとする冪等 API とする。
- Rationale: repository 実装は `updateMany` と `createMany(skipDuplicates: true)`、`deleteMany` を使っており、spec で確定した挙動とも一致する。UI は成功後 `retryInitial()` で一覧を再読込すればよい。
- Alternatives considered: 部分失敗の詳細返却や全体失敗。現状の利用価値に比べて UI 複雑性が増しすぎるため不採用。

## Review start contract

- Decision: カード一覧からの復習開始は `CardListFilter` をそのまま `/api/review/start` に渡し、選択済みカード ID は送らない。
- Rationale: clarified spec で「現在の絞り込み結果で開始」が確定しており、`backend/src/api/review.ts` も `filter` を受けて `listCards()` から対象 ID を組み立てられる。
- Alternatives considered: UI から明示的に `cardIds` を送る。選択状態と review 対象が混ざり、正確性の原則に反するため不採用。

## Minimal option APIs

- Decision: 共有モーダルの候補取得は `GET /api/tags` と `GET /api/collections` に分離し、返却は `FilterOption` の最小集合に限定する。
- Rationale: `searchTagOptions()` と `searchCollectionOptions()` が既に `id` と `name` ベースの最小レスポンスを返しており、Privacy & Minimal Data 原則と一致する。
- Alternatives considered: 一覧 API に候補全件を同梱する。初回ロードが重くなるため不採用。

## Test coverage focus

- Decision: テストは Vitest による API / コンポーネント回帰、Playwright による主要導線確認を継続し、今回の変更ではルーティング、選択クリア、バルク冪等性、レビュー開始対象を重点対象にする。
- Rationale: `test.md` で branch / boundary / E2E の最低要件が明示されている。clarified spec によって分岐ポイントが増えたのは query 変更、ルート切り替え、バルク no-op 成功の 3 点である。
- Alternatives considered: 手動確認のみ。既存挙動維持の制約に対して不十分なため不採用。
