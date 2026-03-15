# 実装計画 (Implementation Plan): 学習カード一覧 (001-card-list)

**ブランチ (Branch)**: `001-card-list` | **日付 (Date)**: 2026-03-10 | **仕様 (Spec)**: `specs/001-card-list/spec.md`
**入力 (Input)**: `specs/001-card-list/spec.md` の機能仕様

## 概要 (Summary)

既存の学習カード一覧画面を、実運用中の TypeScript モノレポ構成に合わせて拡張する。カード一覧は検索、追加フィルタ、ソート、複数選択バルク操作、復習開始、削除確認を維持しつつ、タグとコレクションの絞り込みを検索付き複数選択モーダルに変更する。画面構成は `specs/001-card-list/ascii_ui.txt` に従い、スタイル実装は Tailwind CSS を導入して `specs/001-card-list/theme.json` のトークンを優先利用する。バックエンドはカード一覧 API を複数選択フィルタ対応に更新し、モーダル候補用のタグ・コレクション API を追加する。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18+  
**フロントエンド (Frontend)**: React 18.3 + Vite 5  
**バックエンド (Backend)**: Express 4 + Zod  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6 を継続利用  
**CSS**: Tailwind CSS を新規導入し、`theme.json` を `theme.extend` のソースとして利用  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2 + Testing Library + Playwright  
**テスト実施方法**: `npm run test` と `npm run test:e2e` を基本とし、必要に応じて Storybook で UI 状態を確認する  
**対象プラットフォーム (Target Platform)**: Web SPA + JSON API  
**プロジェクト種別 (Project Type)**: backend / frontend 分離のモノレポ Web application  
**性能目標 (Performance Goals)**: 初回表示で 2 秒以内に一覧の表示開始を認識できること。モーダル候補検索は入力後に体感上の遅延を最小化すること  
**制約 (Constraints)**: 既存機能の挙動を維持すること、`ascii_ui.txt` の構成に従うこと、`theme.json` のトークンを優先し直書き CSS を避けること、無限スクロールの応答性を損なわないこと  
**規模/スコープ (Scale/Scope)**: 学習カード一覧画面、関連 API、関連 UI コンポーネント、テーマ設定、および回帰テストの更新

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に通過済み。Phase 1 の設計後に再チェック済み。*

- 正確性: 復習アルゴリズムや復習対象の算出ロジック自体は変更しない。フィルタ UI 変更後も「現在の絞り込み結果で復習開始」の意味が変わらないことを保証する。
- 継続性・UX: 一覧から復習開始までの主要導線は維持しつつ、タグ/コレクション選択の操作負荷を下げる。`ascii_ui.txt` を画面構成の基準とすることで UX の一貫性を保つ。
- プライバシーとデータ最小化: 追加する候補 API は `id` と表示名に限定し、不要な情報を返さない。削除は既存方針どおり物理削除で扱い、削除確認 UI を維持する。
- 説明可能性: 選択中のタグ/コレクションはボタン横に明示し、適用中の条件をユーザが把握できるようにする。
- 信頼性・セキュリティ: Tailwind 導入と API 変更による回帰を防ぐため、既存の Vitest / Playwright の自動テストを更新する。

*ゲート結果 (Phase 0 / Phase 1 後): PASS。追加の設計制約として、候補 API は最小データ返却、削除フローは既存の確認モーダル維持、回帰テストの更新を必須とする。*

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/001-card-list/
├── ascii_ui.txt
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### ソースコード (リポジトリルート / Source Code)

```text
backend/
├── src/
│   ├── api/           # HTTPエントリーポイントとエンドポイント実装
│   ├── schemas/       # リクエスト/レスポンスの入力検証
│   ├── repositories/  # Prisma を使う永続化・検索処理
│   ├── services/      # 複数 repository を束ねるユースケース処理
│   ├── domain/        # API と UI で共有しやすい型/モデル
│   └── utils/         # カーソル、日付、共通補助関数
└── dist/             # ビルド成果物

frontend/
├── src/
│   ├── assets/        # 画像などのアセット
│   ├── contents/      # 画面表示用の定義データや固定文言
│   ├── pages/         # ページ単位の統合コンポーネント
│   ├── components/
│   │   ├── uiParts/      # 汎用 UI 部品
│   │   └── uniqueParts/  # card-list 固有 UI 部品
│   ├── hooks/         # React hooks
│   ├── services/
│   │   └── api/       # API 呼び出しクライアント
│   ├── domain/        # DTO / 画面で使う型
│   └── utils/
│       └── theme/     # theme.json の変換/参照処理
├── dist/             # ビルド成果物
└── stories/          # Storybook 用の確認資材
```

**構造の決定 (Structure Decision)**: この feature では、既存の backend/frontend 分離構成を維持したまま、カード一覧機能に必要な責務ごとにファイル配置を整理する。バックエンドは `backend/src/api` にカード一覧・タグ候補・コレクション候補・復習開始・バルク操作の HTTP エントリーポイントを置き、入力検証は `backend/src/schemas`、検索と永続化は `backend/src/repositories`、複数処理を束ねる業務ロジックは `backend/src/services` に集約する。フロントエンドは `frontend/src/pages` を画面の組み立て単位とし、再利用可能な入力部品・ボタン・モーダル枠は `frontend/src/components/uiParts`、カード一覧専用のフィルタモーダル・選択バー・カード行は `frontend/src/components/uniqueParts` に分ける。API クライアントは `frontend/src/services/api`、型定義は `frontend/src/domain`、`theme.json` の Tailwind 連携やトークン参照ロジックは `frontend/src/utils/theme` に配置する。タスク化するときは、`1) 既存ファイルの移動先確定`、`2) API 層の再配置`、`3) UI 部品の uiParts / uniqueParts 分離`、`4) services/api・domain・utils/theme の整備`、`5) import と Storybook / test の追従` の5グループに分解して扱う。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

現時点で追加の正当化が必要な憲法違反はない。
