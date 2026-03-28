# 実装計画 (Implementation Plan): 設定画面コレクション登録 (001-collection-settings)

**ブランチ (Branch)**: `001-collection-settings` | **日付 (Date)**: 2026-03-28 | **仕様 (Spec)**: `specs/001-collection-settings/spec.md`
**入力 (Input)**: `specs/001-collection-settings/spec.md` の機能仕様

## 概要 (Summary)

既存の React + Express + Prisma モノレポを維持しながら、設定画面のプレースホルダーをコレクション管理画面へ置き換える。フロントエンドでは `Settings` ページに新規登録フォーム、管理一覧、編集モーダル、削除確認、削除不可状態を追加し、一覧文脈を保ったまま作成・更新・削除を行えるようにする。バックエンドでは既存の候補検索 API `/api/collections` を壊さないように、同一 router 内へ管理用の read/write endpoints を追加し、Collection の補足メモと重複防止を支える schema 拡張、削除不可ガード、一覧用 read model を実装する。重複判定、削除不可条件、エラー表示、手動確認手順、テスト観点は `research.md` と `test.md` に沿って定義する。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18+  
**フロントエンド (Frontend)**: React 18.3 + Vite 5 + React Router DOM 7.13  
**バックエンド (Backend)**: Express 4 + Zod 3  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6  
**CSS**: Tailwind CSS 3.4  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2 + Testing Library + Supertest + Playwright  
**テスト実施方法**: テスト手順・ケース定義はリポジトリルートの `test.md` に従い、`npm run test` と `npm run test:e2e` を基本コマンドとする。Collection 管理では branch / boundary / failure ケースを少なくとも backend repository・API と frontend page に追加する  
**対象プラットフォーム (Target Platform)**: Web SPA + JSON API  
**プロジェクト種別 (Project Type)**: backend / frontend 分離のモノレポ Web application  
**性能目標 (Performance Goals)**: 設定画面初期表示時にコレクション管理一覧の表示開始を 2 秒以内に認識できること。作成・更新・削除可否判定の結果は送信後ただちに UI へ反映されること  
**制約 (Constraints)**: 既存の `/api/collections` 候補検索 contract とカード作成・一覧フィルタの挙動を壊さないこと。削除はカード未所属のコレクションだけを対象とし、所属カードの暗黙移動は行わないこと。認証基盤が未実装のため owner 解決は単一ユーザ前提の server-side provider に閉じ込めること。設定画面は現在プレースホルダーなので、既存のトップレベルレイアウトと theme token を維持したまま差し替えること  
**規模/スコープ (Scale/Scope)**: 1 つの既存ページ置換、1 つの Prisma schema/migration 拡張、1 つの既存 collections router 拡張、数本の管理系 API、フロント/バック/契約/ドキュメント/テスト更新を含む中規模 feature

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に通過済み。Phase 1 の設計後に再チェック済み。*

- 正確性: コレクション重複判定は owner 単位で正規化した名前に基づいて一貫させる。削除可否はカード件数から導出し、API・UI とも同じルールを使う。既存のカード検索やレビューで参照される collection 名解決を壊さない。
- 継続性・UX: 設定画面内で作成・変更・削除を完結させ、編集は一覧文脈を保つモーダルで行う。削除不可理由と失敗時再試行を UI で明確に示し、学習導線を阻害しない。
- プライバシーとデータ最小化: 追加保持データは collection の補足メモと正規化名に限定する。ログには collection 名や補足メモの全文を出さず、ID・件数・結果コード中心の構造化ログに留める。
- 説明可能性: 作成・更新・削除確認・削除不可理由・重複エラーを画面上と API error code で一貫して説明する。`canDelete` と `deleteBlockedReason` を read model に含め、UI が理由をそのまま表示できるようにする。
- 信頼性・セキュリティ: Prisma migration、owner scoped の重複防止、削除時の card count guard、Vitest/Supertest/Playwright の回帰テストを必須条件とする。認可基盤が無い現状では owner provider を 1 箇所に閉じ込め、将来差し替えやすい構造を取る。

*ゲート結果 (Phase 0 / Phase 1 後): PASS。`/api/collections` 検索 API の後方互換維持、Collection schema の `description` と `normalizedName` 追加、管理系 endpoints の新設、削除不可 guard、設定画面のモーダル編集、テスト追加を条件に進める。*

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/001-collection-settings/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### ソースコード (リポジトリルート / Source Code)
<!--
  要対応 (ACTION REQUIRED): 下記のツリーは推奨の初期構成例です。
  リポジトリの実態に合わせて調整し、最終的な plan.md では実在するパスのみを記載してください。
-->

```text
backend/
├── src/
│   ├── api/
│   ├── repositories/
│   ├── schemas/
│   └── services/

frontend/
├── src/
│   ├── components/
│   │   ├── uiParts/
│   │   └── uniqueParts/
│   ├── domain/
│   ├── pages/
│   └── services/
│       └── api/

prisma/
├── schema.prisma
└── migrations/

tests/
├── backend/
├── frontend/
└── e2e/
```

**構造の決定 (Structure Decision)**: backend / frontend 分離構造を維持する。バックエンドは既存の `backend/src/api/collections.ts` を候補検索と管理 endpoints の両方を持つ router へ拡張し、入力検証は `backend/src/schemas`、永続化と削除ガードは `backend/src/repositories` に集約する。フロントエンドは `frontend/src/pages/Settings.tsx` を画面統合層とし、管理一覧・登録フォーム・編集モーダル・削除確認を `frontend/src/components/uniqueParts` と `frontend/src/services/api` に分離する。永続データは `prisma/schema.prisma` と migration で管理し、回帰は `tests/backend`、`tests/frontend`、`tests/e2e` に追加する。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

現時点で追加の正当化が必要な憲法違反はない。

