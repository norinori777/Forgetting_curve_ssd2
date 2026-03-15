# research.md

Decision: Language / Runtime
- Decision: フロントエンド・バックエンドともに TypeScript を採用し、Node.js 18 以上で動作させる。
- Rationale: リポジトリは workspace 構成で TypeScript 5.5 系、Vite、Vitest、Playwright に統一されている。既存構成を維持した方が導入コストと学習コストが最小になる。
- Alternatives considered: 別ランタイムや別言語の導入。既存コード・CI・テスト基盤との不整合が大きいため不採用。

Decision: Frontend framework
- Decision: React 18 + Vite 5 + Storybook 8 を継続利用する。
- Rationale: 既存 `frontend` は React 18 / Vite / Storybook で構成されており、カード一覧 UI とモーダル分割に適している。
- Alternatives considered: Vue / Svelte への移行。今回の変更は UI 改修であり、フレームワーク変更はスコープ外。

Decision: Styling architecture
- Decision: UI 実装は Tailwind CSS を導入し、`specs/001-card-list/theme.json` を Tailwind theme 拡張のソースとして利用する。
- Rationale: 仕様で `theme.json` と `ascii_ui.txt` を画面構成・デザイントークンの基準にすることが明確化された。Tailwind はトークン駆動の再利用と画面全体の一貫性に向いている。
- Alternatives considered: CSS Modules 継続、インライン style、個別 CSS の直書き。トークン統一と再利用の要件に反するため不採用。

Decision: Theme token strategy
- Decision: `theme.json` は Tailwind の `extend.colors`, `fontFamily`, `fontSize`, `spacing`, `borderRadius`, `screens` に読み込む。
- Rationale: すでに `theme.json` は Tailwind 形式に近い JSON になっているため、変換層を薄く保てる。
- Alternatives considered: CSS Variables を唯一の参照元にする。将来的には併用可能だが、現時点では Tailwind 連携を優先する。

Decision: Backend / API
- Decision: Node.js + Express + Zod + Prisma で REST API を継続し、カード一覧取得・タグ候補取得・コレクション候補取得を提供する。
- Rationale: `backend` には Express と Zod、Prisma の構成がすでに存在し、追加 API も同じ層で実装するのが自然。
- Alternatives considered: GraphQL 導入。候補検索と一覧取得には過剰であり、現行構成と乖離するため不採用。

Decision: Storage / DB
- Decision: PostgreSQL + Prisma schema を正とする。
- Rationale: `prisma/schema.prisma` が PostgreSQL datasource と `Card`, `Tag`, `Collection`, `CardTag` の関係をすでに定義している。
- Alternatives considered: NoSQL。タグ・コレクション・並び替え・カーソルの整合を考えると関係 DB の方が適切。

Decision: Multi-select filter serialization
- Decision: タグとコレクションは UI では複数選択とし、API では `tagIds` / `collectionIds` をカンマ区切りクエリ、または JSON body の配列として扱う。
- Rationale: ボタン横表示はラベル、通信は ID に分離することで、表示変更や名称重複に強くなる。
- Alternatives considered: 名前文字列のまま送る。表示名変更や重複名で不安定になるため不採用。

Decision: Option source for modal search
- Decision: タグ選択モーダルとコレクション選択モーダル向けに `GET /api/tags` と `GET /api/collections` を追加する。
- Rationale: モーダル内検索は一覧 API に混ぜず、独立した候補 API とした方が責務が明確でキャッシュしやすい。
- Alternatives considered: 初回一覧レスポンスに全候補を埋め込む。大量データ時の初回応答が重くなるため不採用。

Decision: Testing strategy
- Decision: ユニット/コンポーネントは Vitest + Testing Library、E2E は Playwright、UI 断片の確認は Storybook を用いる。
- Rationale: 既存リポジトリの test runner と完全に一致している。Tailwind 導入後も回帰確認を継続できる。
- Alternatives considered: Jest 追加。Vitest が既にあるため重複導入は不要。

Decision: Performance target
- Decision: SC-002 に従い、初回表示で 2 秒以内にユーザが表示開始を認識できる状態を維持する。候補 API の検索は 300ms 程度の入力ディレイを前提にする。
- Rationale: 無限スクロールとモーダル検索の両立には、一覧と候補 API を分ける設計が有利。
- Alternatives considered: クライアント側で全候補を全件保持して前方一致検索。候補数増加時の初回負荷が不安定になるため不採用。

Decision: Deletion semantics
- Decision: 削除は物理削除のままとし、UI は Tailwind 化しても削除確認フローと挙動は変更しない。
- Rationale: 憲法と spec の既存判断を維持する必要がある。
- Alternatives considered: 論理削除への切り替え。今回の変更は UI とデザインが中心であり、仕様変更にあたるため不採用。


