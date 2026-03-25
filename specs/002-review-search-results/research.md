# research.md

## Runtime and repository strategy

- Decision: 既存の TypeScript + Node.js 18+ のモノレポ構成を維持し、frontend / backend の責務分離を変えない。
- Rationale: root / frontend / backend の package 定義、Vitest、Playwright、Prisma、Storybook がすでにこの構成に揃っており、今回の課題は検索結果と review target set の整合性に限定されるため。
- Alternatives considered: 新しい service 層や別ランタイムを導入する案。フロー整合性の修正に対して影響範囲が大きすぎるため不採用。

## Search result set definition

- Decision: この feature における「検索結果」は、無限スクロールで現在 DOM に描画済みのカード列ではなく、開始時点の `CardListFilter` に一致する card 集合全体として定義する。
- Rationale: 一覧画面は cursor pagination / infinite scroll を使っており、画面に読み込まれている件数は表示済み部分にすぎない。復習対象を DOM 件数に依存させると、同じ検索条件でもスクロール量によって review target set が変わり、正確性を損なう。
- Alternatives considered: 画面上にロード済みのカードだけを対象にする案。利用者のスクロール状況により対象がぶれるため不採用。

## Ordered target resolution for review start

- Decision: review start では `listCards(limit: 200)` を流用せず、検索条件に一致する候補を安定ソート順で解決したうえで、利用可能なカードを最大 200 件まで採用し、超過分を `over_limit` として明示する専用 resolver を使う。
- Rationale: 現状の `/api/review/start` は `listCards()` を `limit: 200` 付きで呼んでおり、200 件超の一致結果を silent truncation する。仕様では 200 件上限自体は許容するが、除外件数と理由を説明する必要があるため、一覧表示用ページング API と review target 解決を分離し、件数上限を明示的に扱う必要がある。
- Alternatives considered: 上限なしで全件を session 化する案、または既存の `listCards(limit: 200)` を流用し続ける案。前者は性能とセッション肥大化のリスクが高く、後者は除外説明ができないため不採用。

## Session snapshot boundary

- Decision: review target set は復習開始時に固定し、開始後に一覧画面側で検索条件や表示内容が変わっても進行中 session へ反映しない。
- Rationale: 既存 `ReviewSession` / `ReviewSessionCard` は orderIndex と filter summary を持つ開始時 snapshot モデルとして機能している。開始後に対象集合を再計算すると進捗、summary、locked assessment の整合性が壊れる。
- Alternatives considered: 一覧条件変更に追随して session 対象を差し替える案。進行中 session の再計算と評価整合性が複雑化するため不採用。

## Review screen reuse

- Decision: Review 画面の snapshot 取得、自己評価、前後移動、ローカルキャッシュ、resume 処理は既存実装をそのまま再利用し、feature では start 時の対象集合解決に集中する。
- Rationale: `ReviewSessionSnapshot`、`reviewSessionRepository.ts`、`Review.tsx` はすでに 1 枚ずつの復習体験を支えており、この feature の要件である「検索結果のカードを 1 枚ずつ表示して復習する」を満たす基盤がある。
- Alternatives considered: Review 画面側で検索条件を再解釈してカード列を再生成する案。責務が二重化し、session persistence の意味が薄れるため不採用。

## Empty and unavailable target handling

- Decision: 開始時点で一致 card が 0 件なら 404 / empty state にし、session は作成しない。resolver は候補解決から session 作成までの間に利用不能になったカードを `unavailable` として除外し、その結果 1 件以上残れば開始し、0 件なら開始失敗として扱う。
- Rationale: 利用者に空の review screen を見せるより、一致対象なしを明示して一覧へ戻す方が UX と信頼性の両方に沿う。利用不能カードは件数と理由だけを返せば説明可能性を保ちながら session の正確性を守れる。
- Alternatives considered: 空 session を作って Review 画面で空表示する案、または利用不能カードが 1 件でもあれば開始自体を中止する案。前者は無意味な session を永続化し、後者は残りの有効カードで学習を継続できなくなるため不採用。

## Contract shape for external interfaces

- Decision: `POST /api/review/start` の入力は引き続き `filter` を中心とし、成功時は既存どおり `snapshot` を返す。ただし `snapshot.filterSummary` に `targetResolution` を追加し、`matchedCount`、`includedCount`、`excludedCount`、`exclusionBreakdown` を返す。
- Rationale: frontend `reviewApi.ts` と Review 画面はすでに snapshot ベースで動いており、root response を変えずに Review 画面・resume・navigation の全経路で同じ説明情報を表示できる。必要なのは除外理由を継続表示できる付加情報である。
- Alternatives considered: `matchedCount` や `excludedCount` を start response の top-level にだけ返す案。初回開始時にしか使えず、リロードや resume 時に説明情報を失うため不採用。

## Test coverage focus

- Decision: backend では filter から ordered target set を解決する分岐、200 件上限適用時の exclusion breakdown、unavailable 除外、frontend / E2E では検索結果からの開始・条件変更後の最新結果・空結果時の非開始・200 件超時の通知表示を重点的に自動テストする。
- Rationale: `test.md` は branch / boundary / failure の網羅を要求しており、今回増える分岐は「検索条件で一致した集合が review target set と一致するか」「どの理由で何件除外されたか」に集中しているため。
- Alternatives considered: 手動確認のみで済ませる案。既存 review 機能との回帰と cap 表示の欠落を防げないため不採用。
