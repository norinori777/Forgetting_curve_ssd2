# research.md

## Runtime and repository strategy

- Decision: frontend / backend ともに既存の TypeScript + Node.js 18+ モノレポ構成を維持する。
- Rationale: ルート workspace、Vitest、Playwright、Prisma、Storybook が既にこの前提で揃っており、設定画面と collections router の拡張で完結できる。
- Alternatives considered: 設定機能だけ別アプリや別 API として切り出す。開発フロー、CI、shared types の分断が大きく不採用。

## Settings page integration

- Decision: `frontend/src/pages/Settings.tsx` のプレースホルダーを置き換え、設定カテゴリ内の 1 セクションとしてコレクション管理を実装する。
- Rationale: 既存ルーティングは `/settings` をトップレベルページとして確保済みで、他 feature の導線もこのページを前提にしている。別ルートや別ページへ分割する必要はない。
- Alternatives considered: `/settings/collections` のサブルートを新設する。現在のパンくずとトップレベル設計に対して過剰で不採用。

## Management API placement

- Decision: 既存の候補検索 endpoint `GET /api/collections` は維持し、管理画面用に `GET/POST/PATCH/DELETE /api/collections/manage...` を同一 router 配下へ追加する。
- Rationale: 現在の `/api/collections` はカード作成やフィルタモーダルが `FilterOption[]` を前提に使用しており、応答 shape を変更すると回帰リスクが高い。管理用 read model は cardCount、canDelete、description を返すため別 contract に分離する方が安全である。
- Alternatives considered: `/api/collections` の GET を管理一覧へ置き換える、または query mode で多態化する。既存 consumers を壊しやすく、型とテストが複雑になるため不採用。

## Collection persistence extension

- Decision: Prisma `Collection` に nullable な `description` と owner 単位の重複防止用 `normalizedName` を追加する。
- Rationale: 現行 schema は `name` と `ownerId` しか持たず、spec で求める補足メモと堅牢な重複防止を満たせない。`normalizedName = lower(trim(name))` を保持し、`(ownerId, normalizedName)` に unique 制約を張れば UI と DB の両方で一貫した重複判定ができる。
- Alternatives considered: 補足メモを保存しない、またはアプリ層だけで重複を検出する。spec と ASCII UI の編集項目を満たせず、競合時の二重登録も防げないため不採用。

## Owner resolution strategy

- Decision: 認証基盤が未実装の現状では、collection 管理 API は server-side の単一ユーザ owner provider を介して `ownerId` を解決する。
- Rationale: schema 上 `ownerId` は必須であり、直接 route に固定値を散らすと後で認証を導入した際に修正点が広がる。provider を 1 箇所に閉じ込めれば将来の user context への差し替えが容易になる。
- Alternatives considered: API リクエストで ownerId を受け取る。クライアントに権限境界を委ねることになり不採用。

## Edit interaction model

- Decision: 既存コレクションの編集は一覧の各行から開始し、対象単位のモーダルで name と description を編集する。
- Rationale: spec clarification で確定しており、一覧文脈を維持したまま 1 件だけを安全に編集できる。新規登録フォームとの責務も分離しやすい。
- Alternatives considered: インライン編集や別ページ遷移。状態管理が煩雑になるか、設定画面内完結の UX を損ねるため不採用。

## Delete safety rule

- Decision: コレクション削除は `cardCount === 0` のときだけ許可し、カードが残る場合は API が 409 `collection_in_use` を返して UI は削除不可理由を表示する。
- Rationale: user clarification で削除不可方針が確定しており、所属カードの暗黙移動を避けられる。UI の `canDelete` 表示だけでは race condition を防げないため、backend guard を必須にする。
- Alternatives considered: 削除時に未分類へ戻す、移動先選択を必須にする。今回の scope を超え、既存カード導線への影響が大きいため不採用。

## Management list read model

- Decision: 管理一覧用 endpoint は `CollectionManagementItem` として `id`, `name`, `description`, `cardCount`, `updatedAt`, `canDelete`, `deleteBlockedReason` を返す。
- Rationale: ASCII UI では一覧内で変更導線・削除可否・補足情報を同時に見せる必要がある。delete 可否をクライアント側で再計算せず、サーバが一度で判断した shape を返す方が説明可能性と一貫性が高い。
- Alternatives considered: クライアントが cardCount だけ受け取り `canDelete` を計算する。エラーメッセージ文言や将来条件変更との整合が崩れやすく不採用。

## Refresh strategy after mutations

- Decision: 作成・更新・削除成功後は一覧を再取得して authoritative state を反映し、成功通知はページローカル state で 1 回だけ表示する。
- Rationale: collection 一覧には cardCount と updatedAt を含み、単純な optimistic update では副作用の整合を取りにくい。再取得の方が実装とテストが単純で、一覧件数が大きくない設定画面では十分許容できる。
- Alternatives considered: optimistic update のみで同期する。失敗時の巻き戻しと derived field 更新が煩雑になるため不採用。

## Test strategy

- Decision: backend では repository/API に create, update, delete blocked, delete success, duplicate name の分岐テストを追加し、frontend では Settings page のフォーム、編集モーダル、削除確認、削除不可表示をテストする。E2E は主要管理フロー 1 本を追加する。
- Rationale: `test.md` は branch / boundary / failure coverage を必須としている。今回の feature は mutation 分岐と UI 状態分岐が多いため、自動テスト追加が DoD に必須である。
- Alternatives considered: 手動確認のみ。憲法の DoD とテスト要件を満たせないため不採用。
