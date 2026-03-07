 # 実装計画：学習カード一覧（001-card-list）

**ブランチ (Branch)**: `001-card-list` | **日付 (Date)**: 2026-03-07 | **仕様 (Spec)**: [spec.md](specs/001-card-list/spec.md#L1)
**入力 (Input)**: `/specs/001-card-list/spec.md` の機能仕様

**注記 (Note)**: このテンプレートは `/speckit.plan` コマンドによって埋められます。実行フローは `.specify/templates/plan-template.md` を参照してください。

## 概要 (Summary)

[機能仕様から要約: 主要要件 + 調査に基づく技術的なアプローチ]

## 技術コンテキスト (Technical Context)

<!--
  要対応 (ACTION REQUIRED): このセクションの内容を、プロジェクトの技術的な前提に置き換えてください。
  ここで示す構造は、検討/反復を進めやすくするためのガイドです。
-->

**言語/バージョン (Language/Version)**: NEEDS CLARIFICATION — repository に言語ランタイムが明示されていないため、実装言語は要決定（候補: TypeScript/Node.js）
**フロントエンド (Frontend)**: Web UI（ブラウザ）前提。具体的フレームワークは NEEDS CLARIFICATION（候補: React + TypeScript）
**バックエンド (Backend)**: NEEDS CLARIFICATION（候補: Node.js + API layer）
**UIカタログ/コンポーネント開発 (Storybook)**: 推奨だが現状不明 → NEEDS CLARIFICATION
**CSS**: NEEDS CLARIFICATION（候補: Tailwind CSS / CSS Modules）
**ORM**: NEEDS CLARIFICATION（候補: Prisma / TypeORM）
**ストレージ (Storage / DB)**: 推奨: 関係 DB（例: PostgreSQL）を想定（カード属性と検索/集計が必要） — 確定は要相談
**テスト (Testing)**: NEEDS CLARIFICATION（候補: Jest/Vitest + Playwright for E2E）
**テスト実施方法**: `test.md` を参照。E2E で主要コアループ（一覧→復習開始）が必須
**対象プラットフォーム (Target Platform)**: Web（ブラウザ） + サーバ（必要に応じて）
**プロジェクト種別 (Project Type)**: Web application
**性能目標 (Performance Goals)**: NEEDS CLARIFICATION（Acceptance: list initial render <2s を想定、SC-002 に準拠）
**制約 (Constraints)**: 無限スクロール＋大量件数での応答性を確保すること（カーソル方式を採用）
**規模/スコープ (Scale/Scope)**: NEEDS CLARIFICATION（想定: 個人〜少人数の学習データの範囲。大規模分析は非スコープ）

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に必ず通過すること。Phase 1 の設計後に再チェックすること。*

[憲法ファイルに基づく要点]

- プライバシーとデータ削除: 憲法は「ユーザは自身の学習データをエクスポート／完全削除できることを保証する」としている。本仕様は `削除は物理削除` を採用しているため、ユーザが要求したデータ完全削除に対応する実装（API + 永続層の完全消去・バックアップ除去手順）を設計フェーズで明示する必要がある。
- 継続性/UX: 主要フロー（一覧→復習開始）は最短化することを憲法で要求している。本仕様の「現在の絞り込み結果で復習開始」はこの原則と整合する。
- 信頼性: 憲法はデータ整合性とバックアップを重視する。本機能での削除は復元不可なため、運用上のバックアップ/リテンションポリシーと整合させる必要がある。

*結論（Phase 0 前）: 重大な憲法違反は見られないが、実装段階で「データ完全削除に伴うバックアップの取り扱い」「監査ログ」「削除確認のUX（明示）」を満たす検討が必要。Phase 1 設計後に再チェックを実施すること。*

## フェーズ1：憲法関連の再評価（設計後）

データモデルと API 契約を作成した後の再評価では、憲法に反する重大な問題は見つかりませんでした。ただし、以下の実施項目を満たす必要があります。

- ユーザが要求した完全削除が一次ストレージからデータを除去し、バックアップや保存ポリシーと整合するように API / DB 手順を実装すること。
- 監査ログや削除確認は、必要以上に PII を露出しない形で運用トレーサビリティを確保できる実装にすること。
- 削除ワークフローを文書化し、利用者向けのプライバシー／削除手順を更新すること。

*ゲート結果: 実施項目を前提に PASS。フェーズ2 で実装とドキュメントの完了を検証します。*

## 生成済みアーティファクト

- `specs/001-card-list/research.md`
- `specs/001-card-list/data-model.md`
- `specs/001-card-list/contracts/openapi.yaml`
- `specs/001-card-list/quickstart.md`
- エージェントコンテキスト更新: `.github/agents/copilot-instructions.md`


## プロジェクト構造

### ドキュメント (本機能 / Documentation)

```text
specs/[###-feature]/
├── plan.md              # このファイル (/speckit.plan の出力)
├── research.md          # Phase 0 の出力 (/speckit.plan)
├── data-model.md        # Phase 1 の出力 (/speckit.plan)
├── quickstart.md        # Phase 1 の出力 (/speckit.plan)
├── contracts/           # Phase 1 の出力 (/speckit.plan)
└── tasks.md             # Phase 2 の出力 (/speckit.tasks) ※/speckit.plan では作られない
```

### ソースコード (リポジトリルート / Source Code)
<!--
  要対応 (ACTION REQUIRED): 下記のツリーは推奨の初期構成例です。
  リポジトリの実態に合わせて調整し、最終的な plan.md では実在するパスのみを記載してください。
-->

```text
backend/
├── api/          # APIエンドポイント
├── services/     # ビジネスロジック
├── repositories/ # データアクセス
├── domain/       # ドメインモデル
└── utils/        # ユーティリティ

frontend/
├── .storybook/       # Storybook設定
├── public/           # 静的ファイル
├── src/
│   ├── assets/       # 画像などのアセット
│   ├── contents/     # ページ表示基盤の紐づけ情報を格納
│   ├── pages/        # ページ(画面)
│   ├── components/
│   │   ├── uiParts/      # 汎用UI部品
│   │   └── uniqueParts/  # 画面固有部品
│   ├── hooks/        # React hooks
│   ├── services/
│   │   └── api/      # API呼び出し
│   ├── domain/       # DTO/ドメイン型
│   └── utils/
│       └── theme/    # テーマ関連
├── dist/             # ビルド成果物
└── storybook-static/ # Storybookビルド成果物
```

**構造の決定**: [採用した構造を記述し、上で列挙した実パスを参照する（例: backend/frontend 分離 + Storybook）]

## 複雑性トラッキング

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

| 違反 (Violation) | 必要な理由 (Why Needed) | 単純案を採用しない理由 (Simpler Alternative Rejected Because) |
|------------------|-------------------------|--------------------------------------------------------------|
| [例: 4つ目のプロジェクト] | [現状の必要性] | [なぜ3つでは足りないか] |
| [例: Repository パターン] | [具体的な課題] | [なぜDB直アクセスではダメか] |
