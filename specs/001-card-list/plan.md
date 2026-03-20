# 実装計画 (Implementation Plan): 学習カード一覧 (001-card-list)

**ブランチ (Branch)**: `001-card-list` | **日付 (Date)**: 2026-03-16 | **仕様 (Spec)**: `specs/001-card-list/spec.md`
**入力 (Input)**: `specs/001-card-list/spec.md` の機能仕様

## 概要 (Summary)

既存の学習カード一覧画面を、現在の TypeScript モノレポ構成のまま拡張する。検索、無限スクロール、復習開始、複数選択バルク操作、削除確認の既存挙動は維持しつつ、ステータスフィルタを単一選択プルダウンへ整理し、タグとコレクションの絞り込みはラジオ切り替え付きの共用モーダルへ統合する。ソート条件は一覧表の上部に埋め込み、画面構成は `ascii_ui.txt`、見た目のトークンは `theme.json` を正本として Tailwind CSS で実装する。バックエンドは既存の一覧 API 契約を維持しつつ、共用モーダルから参照するタグ・コレクション候補 API を提供する。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18+  
**フロントエンド (Frontend)**: React 18.3 + Vite 5  
**バックエンド (Backend)**: Express 4 + Zod  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6 を継続利用  
**CSS**: Tailwind CSS を利用し、`theme.json` を `theme.extend` のソースとして扱う  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2 + Testing Library + Playwright  
**テスト実施方法**: テストの実施手順・方式・ケース定義はリポジトリルートの `test.md` に記載し、通常は `npm run test` と `npm run test:e2e` を実行する  
**対象プラットフォーム (Target Platform)**: Web SPA + JSON API  
**プロジェクト種別 (Project Type)**: backend / frontend 分離のモノレポ Web application  
**性能目標 (Performance Goals)**: SC-002 に従い、初回表示で 2 秒以内に表示開始を認識できること。候補検索は体感遅延を最小化すること  
**制約 (Constraints)**: 既存の検索、フィルタ、ソート、無限スクロール、選択、バルク操作、削除確認、復習開始の挙動を変えないこと。`ascii_ui.txt` と `theme.json` を優先し、直書き CSS を避けること  
**規模/スコープ (Scale/Scope)**: 学習カード一覧画面、関連 API、関連 UI コンポーネント、テーマ設定、および回帰テストの更新

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に通過済み。Phase 1 の設計後に再チェック済み。*

- 正確性: 復習アルゴリズムや復習対象の算出ロジックは変更しない。UI の変更後も「現在の絞り込み結果で復習開始」の意味を維持する。
- 継続性・UX: ステータスフィルタを単一選択プルダウンに整理し、タグ/コレクション選択は共用モーダルに統一して操作負荷を減らす。主要導線は維持する。
- プライバシーとデータ最小化: 候補 API は `id` と表示名の最小情報のみ返却する。不要な学習データは追加返却しない。
- 説明可能性: 選択中のタグ/コレクションはボタン横に表示し、ソート条件は一覧表上部で明示する。ステータスフィルタも単一選択状態を視認できるようにする。
- 信頼性・セキュリティ: 回帰防止のため既存の Vitest / Playwright を更新し、削除フローは既存の二段階確認を維持する。

*ゲート結果 (Phase 0 / Phase 1 後): PASS。追加の設計制約として、候補 API は最小データ返却、ステータスフィルタは単一選択、削除フローは既存の確認モーダル維持、回帰テストの更新を必須とする。*

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
│   ├── api/
│   ├── schemas/
│   ├── repositories/
│   ├── services/
│   ├── domain/
│   └── utils/

frontend/
├── src/
│   ├── components/
│   │   ├── uiParts/
│   │   └── uniqueParts/
│   ├── domain/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   │   └── api/
│   └── utils/
│       └── theme/
└── stories/
```

**構造の決定 (Structure Decision)**: backend / frontend の分離構造を維持し、バックエンドは `backend/src/api` にカード一覧・候補取得・復習開始・バルク操作の HTTP エントリーポイントを置く。入力検証は `backend/src/schemas`、検索と永続化は `backend/src/repositories`、業務ロジックは `backend/src/services` に集約する。フロントエンドは `frontend/src/pages` を画面統合単位とし、再利用可能な入力部品とモーダル枠は `frontend/src/components/uiParts`、一覧固有 UI は `frontend/src/components/uniqueParts` に分割する。`theme.json` との連携は `frontend/src/utils/theme` で扱う。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

現時点で追加の正当化が必要な憲法違反はない。
