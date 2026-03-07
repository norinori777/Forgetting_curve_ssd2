# 実装計画 (Implementation Plan): [FEATURE]

**ブランチ (Branch)**: `[###-feature-name]` | **日付 (Date)**: [DATE] | **仕様 (Spec)**: [link]
**入力 (Input)**: `/specs/[###-feature-name]/spec.md` の機能仕様

**注記 (Note)**: このテンプレートは `/speckit.plan` コマンドによって埋められます。実行フローは `.specify/templates/plan-template.md` を参照してください。

## 概要 (Summary)

[機能仕様から要約: 主要要件 + 調査に基づく技術的なアプローチ]

## 技術コンテキスト (Technical Context)

<!--
  要対応 (ACTION REQUIRED): このセクションの内容を、プロジェクトの技術的な前提に置き換えてください。
  ここで示す構造は、検討/反復を進めやすくするためのガイドです。
-->

**言語/バージョン (Language/Version)**: [例: TypeScript（Node.js）または NEEDS CLARIFICATION]  
**フロントエンド (Frontend)**: [例: React または NEEDS CLARIFICATION]  
**バックエンド (Backend)**: [例: Node.js / Express.js または NEEDS CLARIFICATION]  
**UIカタログ/コンポーネント開発 (Storybook)**: [例: Storybook または NEEDS CLARIFICATION]  
**CSS**: [例: Tailwind CSS または NEEDS CLARIFICATION]  
**ORM**: [例: Prisma または NEEDS CLARIFICATION]  
**ストレージ (Storage / DB)**: [例: PostgreSQL または N/A]  
**テスト (Testing)**: [例: Vitest/Jest/Playwright 等 または NEEDS CLARIFICATION]  
**テスト実施方法**: テストの実施手順・方式・ケース定義はリポジトリルートの `test.md` に記載します。  
**対象プラットフォーム (Target Platform)**: [例: Web（ブラウザ）+ サーバ（Node.js）または NEEDS CLARIFICATION]  
**プロジェクト種別 (Project Type)**: [例: Web application または NEEDS CLARIFICATION]  
**性能目標 (Performance Goals)**: [ドメイン依存: 例 1000 req/s, 10k lines/sec, 60 fps または NEEDS CLARIFICATION]  
**制約 (Constraints)**: [ドメイン依存: 例 <200ms p95, <100MB memory, offline-capable または NEEDS CLARIFICATION]  
**規模/スコープ (Scale/Scope)**: [ドメイン依存: 例 10k users, 1M LOC, 50 screens または NEEDS CLARIFICATION]

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に必ず通過すること。Phase 1 の設計後に再チェックすること。*

[憲法ファイルに基づいて決まるゲート条件]

## プロジェクト構造 (Project Structure)

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

**構造の決定 (Structure Decision)**: [採用した構造を記述し、上で列挙した実パスを参照する（例: backend/frontend 分離 + Storybook）]

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

| 違反 (Violation) | 必要な理由 (Why Needed) | 単純案を採用しない理由 (Simpler Alternative Rejected Because) |
|------------------|-------------------------|--------------------------------------------------------------|
| [例: 4つ目のプロジェクト] | [現状の必要性] | [なぜ3つでは足りないか] |
| [例: Repository パターン] | [具体的な課題] | [なぜDB直アクセスではダメか] |
