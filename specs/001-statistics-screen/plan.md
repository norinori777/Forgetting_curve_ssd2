# 実装計画 (Implementation Plan): 統計画面 ASCII UI デザイン

**ブランチ (Branch)**: `feature/001-statistics-screen` | **日付 (Date)**: 2026-03-28 | **仕様 (Spec)**: `C:\work\Forgetting_curve_ssd2\Forgetting_curve\specs\001-statistics-screen\spec.md`
**入力 (Input)**: `C:\work\Forgetting_curve_ssd2\Forgetting_curve\specs\001-statistics-screen\spec.md` の機能仕様

## 概要 (Summary)

既存の `/stats` プレースホルダーを、学習サマリー 4 指標、既定 7 日間の期間切り替え、学習量推移、正答率推移、タグ別内訳、インサイト、空状態・部分欠損・取得失敗を備えた実画面に置き換える。技術的には、`GET /api/stats?range=` の専用集計 API を追加し、Prisma 経由で `cards`、`review_session_cards`、`card_tags`、`tags` を集計して最小限の統計 snapshot を返す。フロントは `frontend/src/pages/Stats.tsx` を中心に、既存 `AppLayout`、`AsyncState`、`RetryBanner` を再利用しつつ、統計専用 DTO と UI コンポーネントで構成し、最後に取得成功した snapshot をローカル保存して失敗時フォールバックに使う。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18 以上  
**フロントエンド (Frontend)**: React 18.3 + React Router DOM 7.13 + Vite 5  
**バックエンド (Backend)**: Express 4 (`backend/src/index.ts` で API router を mount)  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6  
**CSS**: Tailwind CSS 3.4  
**ORM**: Prisma 5.14  
**ストレージ (Storage / DB)**: PostgreSQL  
**テスト (Testing)**: Vitest 2, Testing Library, Supertest, Playwright  
**テスト実施方法**: テストの実施手順・方式・ケース定義はリポジトリルートの `test.md` に従い、branch coverage と境界値テストを必須とする。  
**対象プラットフォーム (Target Platform)**: Web ブラウザ + Node.js API サーバ  
**プロジェクト種別 (Project Type)**: backend / frontend 分離の Web application  
**性能目標 (Performance Goals)**: `GET /api/stats` は代表データセットで p95 700ms 以内、期間切り替え後の主要 KPI 更新は 1 秒以内、主要情報は 1 画面または短い 1 スクロールで認識可能にする  
**制約 (Constraints)**: 既存 `/stats` ルートと `AppLayout` を維持すること、レスポンスは集計値と短い説明だけを返しカード本文や回答本文を返さないこと、UTC 日付境界とタグ集計の意味を一貫させること、データなしは「レビュー回答 0 件」で判定すること、初期表示の既定期間は 7 日間に固定すること、失敗時は再試行とローカルフォールバックの両方を提供すること  
**規模/スコープ (Scale/Scope)**: 1 画面、1 取得 API、4 期間、4 KPI、2 推移セクション、1 タグ別内訳、3 状態変種（空/部分欠損/取得失敗）

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に必ず通過すること。Phase 1 の設計後に再チェックすること。*

### Phase 0 Gate

- 正確性: PASS。統計は `review_session_cards.assessed_at` と `assessment` を根拠に計算し、期間切り替え・前期間比・連続学習日数の定義を spec clarifications に固定する。
- 継続性・UX: PASS。既存 `/stats` ルートを実ページに差し替え、期間タブと主要 KPI から数秒で状況判断できる構成を維持する。
- プライバシーとデータ最小化: PASS。API は集約値・タグ名・短い insight のみ返し、カード本文や個別回答内容を返さない。
- 説明可能性: PASS。正答率算出ルール、前期間比、タグ別内訳、最弱タグに基づく insight を明文化して UI に反映する。
- 信頼性・セキュリティ: PASS。全失敗は 503、部分欠損は成功 payload 内 `unavailableSections` で明示し、再試行導線と最後の成功 snapshot によるローカルフォールバックを必須にする。

### Phase 1 Re-check

- 正確性: PASS。contract と data model は `selectedRange`、`summary`、`trend`、`tagBreakdown`、`state` を固定し、計算対象をレビュー回答ベースに限定した。
- 継続性・UX: PASS。`Stats.tsx` は既存 `AppLayout` 配下で実装し、range tabs、summary cards、trend panels、state panel の順で視線移動を保つ。
- プライバシーとデータ最小化: PASS。tag 集計は件数と平均正答率のみ、insight は集約文言のみで PII を持ち出さない。
- 説明可能性: PASS。research で採用した `forgot=0 / uncertain=50 / remembered=100 / perfect=100` の accuracy ルールを設計文書に固定した。
- 信頼性・セキュリティ: PASS。全体 failure と部分欠損を分離し、frontend は degraded rendering、retry、最後の成功 snapshot のローカルフォールバックを提供する前提で設計した。

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/001-statistics-screen/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
├── ascii_ui.txt
└── spec.md
```

### ソースコード (リポジトリルート / Source Code)
<!--
  要対応 (ACTION REQUIRED): 下記のツリーは推奨の初期構成例です。
  リポジトリの実態に合わせて調整し、最終的な plan.md では実在パスと作成予定パスを区別して記載してください。
-->

```text
backend/
├── src/
│   ├── index.ts
│   ├── api/
│   │   ├── home.ts
│   │   └── stats.ts              # 作成予定
│   ├── repositories/
│   │   ├── homeRepository.ts
│   │   └── statsRepository.ts    # 作成予定
│   ├── schemas/
│   │   ├── home.ts
│   │   └── stats.ts              # 作成予定
│   ├── domain/
│   │   └── review.ts
│   └── db/
│       └── prisma.ts
├── contracts/
│   └── openapi.yaml
└── package.json

frontend/
├── src/
│   ├── App.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   └── Stats.tsx
│   ├── components/
│   │   ├── uiParts/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AsyncState.tsx
│   │   │   └── RetryBanner.tsx
│   │   └── uniqueParts/
│   │       ├── StatsRangeTabs.tsx       # 作成予定
│   │       ├── StatsSummaryCard.tsx     # 作成予定
│   │       ├── StatsTrendPanel.tsx      # 作成予定
│   │       ├── StatsTagBreakdown.tsx    # 作成予定
│   │       └── StatsInsightPanel.tsx    # 作成予定
│   ├── domain/
│   │   └── stats.ts                     # 作成予定
│   ├── services/
│   │   └── api/
│   │       └── statsApi.ts              # 作成予定
│   └── utils/
│       ├── routes/
│       │   └── topLevelPages.ts
│       └── statsDashboardStorage.ts     # 作成予定
└── package.json

tests/
├── backend/
│   └── stats.test.ts                    # 作成予定
├── frontend/
│   └── stats.test.tsx                   # 作成予定
└── e2e/
    └── stats-screen.spec.ts             # 作成予定（必要時）
```

**構造の決定 (Structure Decision)**: backend / frontend 分離構成を維持し、バックエンドは `backend/src/api/stats.ts` と `backend/src/repositories/statsRepository.ts` に統計集計責務を閉じ込める。フロントエンドは既存 `Stats.tsx` を差し替えつつ、range tabs・summary cards・trend panels・tag breakdown を `frontend/src/components/uniqueParts/` に分離し、`AppLayout` と共通 async UI を再利用する。ローカルフォールバック用の最終成功 snapshot は `frontend/src/utils/statsDashboardStorage.ts` に閉じ込める。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**
該当なし。
