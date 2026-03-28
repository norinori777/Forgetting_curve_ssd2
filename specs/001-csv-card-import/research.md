# research.md

## CSV decoding and parsing strategy

- Decision: ブラウザ側で `File.arrayBuffer()` を読み取り、`TextDecoder` で UTF-8、UTF-8 BOM、Shift_JIS の順に decode を試し、decode 後の文字列は Papa Parse で CSV 行列へ変換する。
- Rationale: 受け付け文字コードが複数あり、quoted field、CRLF/LF、カンマを含むセルなどの CSV 特有の境界条件は実績あるパーサで扱う方が安全である。raw CSV をサーバへ送らないため、プライバシー原則とも整合する。
- Alternatives considered: `File.text()` だけで UTF-8 のみ扱う案は Shift_JIS を満たせない。独自 CSV パーサ実装は quoted field 周辺のバグリスクが高い。multipart でファイルをそのままサーバ送信する案は既存 Express 構成に upload middleware がなく、raw file 保持も不要なため不採用。

## Validation split between frontend and backend

- Decision: フロントエンドは文字コード判定、5 列 CSV の構文解析、列数不一致などの構造チェックを担当し、バックエンドは collection name 解決、必須値、answer の optional 正規化、row-level business validation、import 実行可否の最終判定を担当する。
- Rationale: UI はアップロード直後に即時フィードバックを返せる一方、既存コレクション照合や owner スコープ判定、answer の保存形式統一はサーバ側が正本である。二段 validation にすると UX と整合性を両立できる。
- Alternatives considered: すべてフロントのみで判定する案は collection の真偽を保証しづらい。final submit 時だけバックエンドで検証する案は「登録前に確認」の仕様を満たしにくい。

## Bulk import API design

- Decision: cards API に `POST /api/cards/import/validate` と `POST /api/cards/import` を追加し、どちらも JSON body で parsed rows を受け取る。
- Rationale: 現在の backend は JSON + Zod のルーティングパターンで統一されており、multipart infrastructure を追加せずに一貫した設計を保てる。validate と import を分けることで、プレビュー表示と最終登録を明確に分離できる。
- Alternatives considered: 単一 endpoint に dry-run flag を持たせる案は contract と UI 状態遷移が複雑になる。raw file upload endpoint は既存実装と乖離が大きい。

## Collection name resolution rule

- Decision: CSV の第 5 カラムは collection id ではなく collection 名として受け取り、`collectionRepository.ts` と同じ正規化規則 `trim + toLocaleLowerCase('ja-JP')` を用いて owner 単位で照合する。
- Rationale: 仕様は collection 名指定であり、Prisma schema には `normalizedName` が存在する。既存の collection 管理と同じ正規化を使うことで、大文字小文字差や前後空白による誤判定を避けられる。
- Alternatives considered: 完全一致の case-sensitive 比較は既存管理画面のルールと不整合になる。フロントで取得した候補一覧だけで比較する案は検索件数制限や stale data の問題がある。

## Persistence and rollback strategy

- Decision: import endpoint は 1 回の Prisma トランザクションで全行を処理し、collection name を事前解決したうえで、unique tag 名を upsert、各 card を answer 値込みで create、card_tags を createMany する。answer が空欄の行は null として保存し、1 行でも失敗したら全件ロールバックする。
- Rationale: clarify で「全件成功時のみ確定」と「回答列は optional」が確定している。既存 `createCard` の tag upsert ロジックと `Card.answer` の型を活かせば、単票登録と bulk 登録で整合した永続化を維持できる。
- Alternatives considered: 既存 `createCard` をループ呼び出しするだけの案は transaction の境界を制御しづらい。部分成功を許可する案は clarify に反するため不採用。

## Optional answer column handling

- Decision: CSV の第 3 カラムを回答列として追加し、空欄は null、値がある場合はそのまま `Card.answer` へ保存する。
- Rationale: 単票登録画面でも回答は optional であり、CSV 一括登録だけ回答必須にすると登録体験が不整合になる。空欄を null に統一すれば既存データモデルと矛盾しない。
- Alternatives considered: 回答列を必須にする案は既存カード作成フローと整合しない。回答列を無視する案はユーザーの明示要求を満たさない。

## CSV import state in the registration page

- Decision: 既存の `CardCreate` ページに単票登録と CSV 一括登録のセクション切り替えを追加し、CSV import は page-owned state として `selectedFile`, `encoding`, `rows`, `issues`, `summary`, `phase` を保持する。
- Rationale: 既存の登録画面が page component 主導で state を持っており、同じ責務境界を維持した方が回帰リスクが低い。raw CSV を sessionStorage に保存しないことで、容量増加と privacy リスクを避けられる。
- Alternatives considered: CSV import を別 route に分離する案は導線とヘッダー要件を増やす。グローバル store 導入は単一 feature に対して過剰である。

## User-facing message catalog strategy

- Decision: CSV import の成功・失敗・補助文言は `docs/messages.md` に追加し、列ラベル、セクション見出し、ボタン名は画面実装側に残す。
- Rationale: 既存の学習カード登録 feature と同じ管理方式に揃えると、一覧画面への flash message と validation copy を一元管理できる。
- Alternatives considered: 文言をコンポーネント直書きに戻す案は既存方針と不整合。全 UI テキストを messages 化する案は過剰で可読性が落ちる。

## Test strategy

- Decision: frontend unit test で decode / parse / row issue mapping、backend integration test で validate/import contract と rollback、Playwright で「CSVアップロード -> プレビュー -> 一括登録 -> 一覧メッセージ」の主要導線を追加する。
- Rationale: `test.md` は branch coverage、boundary、bulk rollback を要求している。CSV import は encoding、header、missing column、unknown collection、transaction failure と分岐が多いため、自動テストなしでは回帰しやすい。
- Alternatives considered: 手動確認のみは DoD を満たせないため不採用。
