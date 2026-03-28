# 実装計画 (Implementation Plan): 学習カードCSV一括登録 (001-csv-card-import)

**ブランチ (Branch)**: `001-csv-card-import` | **日付 (Date)**: 2026-03-29 | **仕様 (Spec)**: `specs/001-csv-card-import/spec.md`
**入力 (Input)**: `specs/001-csv-card-import/spec.md` の機能仕様

## 概要 (Summary)

既存の学習カード登録画面に CSV 一括登録セクションを追加し、ユーザーがアップロードした 5 列 CSV をブラウザ側で文字コード判定付きに読み込み、プレビューと行単位エラーを確認したうえで一括登録できるようにする。CSV は「タイトル、学習内容、回答、タグ、コレクション」の順で扱い、回答列は空欄を許容する。CSV 解析はフロントエンドで行い、生ファイルはサーバへ送らず、バックエンドには検証済みの行データを JSON で送る。バックエンドは `POST /api/cards/import/validate` と `POST /api/cards/import` を cards API に追加し、回答値の取り込み、コレクション名照合、未登録タグ作成、全件ロールバック付き一括登録を Prisma トランザクションで実行する。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18+  
**フロントエンド (Frontend)**: React 18.3 + Vite 5 + React Router DOM 7.13  
**バックエンド (Backend)**: Express 4 + Zod 3  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6  
**CSS**: Tailwind CSS 3.4 (`theme.json` をデザイントークン正本として扱う)  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2 + Testing Library + Supertest + Playwright  
**テスト実施方法**: テスト手順・方式・ケース定義はリポジトリルートの `test.md` に従い、`npm run test` と `npm run test:e2e` を基本コマンドとする  
**対象プラットフォーム (Target Platform)**: Web SPA + JSON API  
**プロジェクト種別 (Project Type)**: backend / frontend 分離のモノレポ Web application  
**性能目標 (Performance Goals)**: 100 行程度の CSV について、ファイル選択からプレビュー表示までを通常端末で概ね 2 秒以内、一括登録確定は単一操作で完了し、SC-001 の 3 分以内完了を満たすこと  
**制約 (Constraints)**: 既存の単票登録フローと `POST /api/cards` の挙動を壊さないこと。第 3・第 4・第 5 カラムは値が空欄でも列自体は必須、ヘッダー行は指定 5 列名に完全一致した場合のみ読み飛ばすこと。受け付け文字コードは UTF-8 / UTF-8 BOM / Shift_JIS。生 CSV をサーバ保存しないこと。コレクションは既存 owner スコープ内の名前一致のみ有効とすること。回答列は空欄時に null として扱うこと  
**規模/スコープ (Scale/Scope)**: 既存 1 画面の拡張、cards API に 2 endpoint 追加、repository / schema / domain / UI / docs / tests 更新を含む中規模 feature。DB schema 変更は不要

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に通過済み。Phase 1 の設計後に再チェック済み。*

- 正確性: 一括登録は validate endpoint と import endpoint の二段で検証し、5 列構造不正、必須値不足、存在しないコレクションを取り込み前に検出する。回答列は optional とし、値がある場合のみ `Card.answer` に反映する。import は全件成功時のみ確定し、1 件でも失敗した場合は Prisma トランザクションで全件ロールバックする。
- 継続性・UX: 学習カード登録画面の中で単票登録と CSV 一括登録を切り替えられる構成にし、アップロード直後に件数・プレビュー・エラー一覧を示して迷いを減らす。成功後はカード一覧へ戻し、登録件数を含む完了メッセージを表示する。
- プライバシーとデータ最小化: 生 CSV ファイルはブラウザ内でのみ読み取り、サーバへは正規化済みの行データだけを送る。ログにはファイル内容や学習内容全文を含めず、行数や件数などのメタデータに限定する。
- 説明可能性: 行番号付きの validation issue、文字コード案内、5 列の列順ガイド、プレビュー要約により、ユーザーが何を修正すべきかを即座に理解できるようにする。`docs/messages.md` に成功・失敗・補助文言を追加し、実装と仕様の文言基準を揃える。
- 信頼性・セキュリティ: CSV 解析は実績あるライブラリと `TextDecoder` を使い、quoted field や改行表現を安定処理する。バックエンドでは Zod で payload を検証し、collection name 解決と tag upsert を owner スコープのトランザクションで行う。Vitest、Supertest、Playwright で正常系・失敗系・ロールバック・文字コード分岐を回帰確認する。

*ゲート結果 (Phase 0 / Phase 1 後): PASS。raw file 非保存、行番号付きエラー、全件ロールバック、owner スコープの collection name 解決、自動テスト追加を必須条件として設計を進める。*

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/001-csv-card-import/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md

docs/
└── messages.md
```

### ソースコード (リポジトリルート / Source Code)

```text
backend/
├── contracts/
├── src/
│   ├── api/
│   ├── repositories/
│   ├── schemas/
│   └── services/

frontend/
├── src/
│   ├── components/
│   │   └── uniqueParts/
│   ├── domain/
│   ├── pages/
│   └── services/
│       └── api/
└── stories/
```

**構造の決定 (Structure Decision)**: backend / frontend 分離構造を維持する。フロントエンドは `frontend/src/pages/CardCreate.tsx` に CSV import セクションを統合し、`frontend/src/domain/cardCsvImport.ts`、`frontend/src/services/api/cardCsvImportApi.ts`、`frontend/src/components/uniqueParts/CardCsvImport*.tsx` に解析・表示責務を分離する。バックエンドは `backend/src/api/cards.ts` に validate/import endpoint、`backend/src/schemas/cards.ts` に 5 列 import payload schema、`backend/src/repositories/cardRepository.ts` に回答値を含む collection 解決と bulk create helper を追加する。DB schema は増やさず、feature contract は `specs/001-csv-card-import/contracts/openapi.yaml` を正本とする。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

現時点で追加の正当化が必要な憲法違反はない。
