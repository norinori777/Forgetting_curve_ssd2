# 実装計画 (Implementation Plan): 共通ヘッダー簡素化

**ブランチ (Branch)**: `001-shrink-header-menu` | **日付 (Date)**: 2026-03-29 | **仕様 (Spec)**: `specs/001-shrink-header-menu/spec.md`
**入力 (Input)**: `specs/001-shrink-header-menu/spec.md` の機能仕様

## 概要 (Summary)

固定共通ヘッダーからパンくず専用領域とホーム用メニュー項目を取り除き、ブランド領域をホーム導線へ置き換える。実装は既存の `AppLayout` と `topLevelPages` を単一の情報源として整理し、トップレベル遷移は維持したままヘッダーの縦幅と本文開始位置を詰める。現在地の認識は、既に本文に見出しを持つページ群と、復習画面の `ReviewProgressHeader` を使って補完する。バックエンド、DB、API 契約は変更せず、frontend の共有レイアウト、ルートメタデータ、ナビゲーション回帰テストに限定して改修する。

## 技術コンテキスト (Technical Context)

**言語/バージョン (Language/Version)**: TypeScript 5.5 / Node.js 18+  
**フロントエンド (Frontend)**: React 18.3 + Vite 5 + React Router DOM 7.13（現行の declarative routes API を継続利用）  
**バックエンド (Backend)**: Express 4 + Zod。今回の機能では変更なし  
**UIカタログ/コンポーネント開発 (Storybook)**: Storybook 8.6 を継続利用  
**CSS**: Tailwind CSS 3.4。既存トークンとユーティリティクラスを優先利用  
**ORM**: Prisma 5.14。今回の機能では変更なし  
**ストレージ (Storage / DB)**: PostgreSQL。今回の機能では変更なし  
**テスト (Testing)**: Vitest 2 + Testing Library + Playwright  
**テスト実施方法**: テストの実施手順・方式・ケース定義はリポジトリルートの `test.md` に従う。計画上は shared layout の unit/UI テスト 1 件以上と、主要遷移の E2E スモーク確認を追加対象とする  
**対象プラットフォーム (Target Platform)**: Web SPA（ブラウザ）  
**プロジェクト種別 (Project Type)**: backend / frontend 分離のモノレポ Web application  
**性能目標 (Performance Goals)**: ヘッダー簡素化で追加 API 呼び出しを発生させず、client-side route transition と初回レンダリングの体感を悪化させない。固定ヘッダー変更による本文隠れや不要なレイアウトシフトを発生させない  
**制約 (Constraints)**: パンくずを削除すること、ホームリンクをヘッダーメニューから除去してブランド領域に統一すること、ホーム以外のトップレベル遷移順序とラベルを維持すること、breadcrumb 代替として本文側の現在地認識を維持すること、backend/API/DB を変更しないこと  
**規模/スコープ (Scale/Scope)**: 1 つの shared layout、1 つの route metadata モジュール、5 つのトップレベルメニュー表示、ブランドリンク 1 箇所、トップレベルページの現在地表示確認、回帰テスト少数追加の小規模 frontend 改修

## 憲法チェック (Constitution Check)

*ゲート (GATE): Phase 0 の調査前に通過済み。Phase 1 の設計後に再チェック済み。*

- 正確性: 復習スケジューリング、カード状態、API 応答は変更しない。レイアウト変更はナビゲーション表示層に限定する。
- 継続性・UX: 学習開始までの縦方向占有を減らし、ホーム導線をブランド領域に集約してナビゲーションを簡潔化する。現在地は各ページ見出しまたは復習進行ヘッダーで補完する。
- プライバシーとデータ最小化: 新しいデータ収集や追加送信は発生しない。
- 説明可能性: メニュー構成の変更は一貫した導線ルールに統一され、ユーザーはブランド領域からホームへ戻れる。現在地は本文側の見出しに委ねる。
- 信頼性・セキュリティ: client-side route transition を維持し、リンク切れや本文重なりを防ぐため自動テストと手動確認手順を追加する。セキュリティ面の新規リスクは発生しない。

*ゲート結果 (Phase 0 / Phase 1 後): PASS。frontend-only の shared layout 変更として扱い、breadcrumb 削除、ブランドリンク化、固定ヘッダー offset 調整、ナビゲーション回帰テスト追加を必須条件とする。*

## プロジェクト構造 (Project Structure)

### ドキュメント (本機能 / Documentation)

```text
specs/001-shrink-header-menu/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── header-navigation.md
└── tasks.md
```

### ソースコード (リポジトリルート / Source Code)

```text
frontend/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   └── uiParts/
│   │       ├── AppLayout.tsx
│   │       └── ReviewProgressHeader.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── CardList.tsx
│   │   ├── CardCreate.tsx
│   │   ├── Review.tsx
│   │   ├── Stats.tsx
│   │   └── Settings.tsx
│   └── utils/
│       └── routes/
│           └── topLevelPages.ts

tests/
├── frontend/
└── e2e/
```

**構造の決定 (Structure Decision)**: 変更は frontend の shared layout と route metadata に集約する。`frontend/src/components/uiParts/AppLayout.tsx` を固定ヘッダーの唯一の責務点とし、`frontend/src/utils/routes/topLevelPages.ts` をトップレベル導線の単一情報源として扱う。各ページの現在地表示は既存の本文見出しや `ReviewProgressHeader` を再利用し、backend や API 契約には変更を波及させない。

## 複雑性トラッキング (Complexity Tracking)

> **憲法チェックで違反があり、正当化が必要な場合のみ記入する**

現時点で追加の正当化が必要な憲法違反はない。
*** Add File: c:\work\Forgetting_curve_ssd2\Forgetting_curve\specs\001-shrink-header-menu\research.md
# Research: 共通ヘッダー簡素化

## Decision 1: 既存の shared layout と route metadata をそのまま改修の中心にする

- Decision: `frontend/src/components/uiParts/AppLayout.tsx` と `frontend/src/utils/routes/topLevelPages.ts` を中心に変更し、新しい layout abstraction や別ナビゲーション設定ファイルは追加しない。
- Rationale: 現状でも固定ヘッダー、トップレベルメニュー、breadcrumb 表示、本文 top offset が `AppLayout` に集約されている。トップレベルページ解決も `topLevelPages` が単一の情報源になっているため、ここを更新するのが最小変更で一貫性を保ちやすい。
- Alternatives considered: 各ページ側で個別にヘッダー余白や現在地表示を調整する案は、変更箇所が分散しやすく、トップレベル導線の整合性も崩れやすいため不採用とした。

## Decision 2: ホーム導線はブランド領域へ集約し、メニューからホームを除外する

- Decision: ヘッダー左側のブランド領域をクリック可能なホーム導線とし、トップレベルメニューから「ホーム」を除外する。
- Rationale: 仕様でホームリンクのメニュー削除が確定しており、既存 header で最も自然に再利用できる導線はブランド領域である。ブランド領域は全画面で固定表示されるため、ユーザーが学習中でも一貫してホームへ戻れる。
- Alternatives considered: 1 つ目のナビゲーションボタンをホームのまま残す案は clarify に反する。アイコンだけをホーム導線にする案はクリック領域が狭くなりやすく、サービス名まで含めたブランドリンクの方が accessibility と発見性の面で有利なため採用しない。

## Decision 3: breadcrumb の代替は各ページ本文の見出しと復習進行ヘッダーに任せる

- Decision: breadcrumb を別 UI で置き換えず、Home / CardList / CardCreate / Stats / Settings は既存の `h1` 見出し、Review は `ReviewProgressHeader` とコンテンツ文脈で現在地を示す。
- Rationale: 既存実装を確認すると、主要トップレベルページは本文先頭にページ見出しを持っており、Review だけは進行専用ヘッダーを持つ。breadcrumb を削除しても、新規コンポーネント追加なしで現在地の理解を維持できる。
- Alternatives considered: breadcrumb の代わりに header 内へページラベルを残す案は、再び縦方向スペースを消費し、今回の主目的であるヘッダー縮小と競合するため不採用とした。

## Decision 4: 固定ヘッダーの縮小は静的 spacing 調整で行い、実行時測定は導入しない

- Decision: `AppLayout` の header padding と `main` の top padding を静的クラスで対応させ、JavaScript による動的高さ計測や resize 監視は導入しない。
- Rationale: 現在も `AppLayout` は固定値の top padding で本文との重なりを防いでいる。breadcrumb を削除してヘッダー構造を単純化すれば、静的 spacing の再調整だけで十分対応でき、不要な layout shift や複雑性を避けられる。
- Alternatives considered: `ResizeObserver` や `getBoundingClientRect` で header 高を測る案は、今回の小規模 UI 改修には過剰であり、初回レンダリングや hydration 時のズレも増やすため不採用とした。
*** Add File: c:\work\Forgetting_curve_ssd2\Forgetting_curve\specs\001-shrink-header-menu\data-model.md
# Data Model: 共通ヘッダー簡素化

## Overview

この機能は永続化データを変更しない。対象は共通ヘッダーの表示状態とトップレベル導線の表現ルールであるため、UI state と route metadata を設計対象とする。

## Entities

### 1. HeaderLayoutState

- Purpose: 固定ヘッダーと本文開始位置の整合を管理する表示状態
- Fields:
  - `currentPath`: 現在の pathname
  - `currentPageLabel`: 現在地として解決されたトップレベルページ名
  - `showsBreadcrumb`: 常に `false`
  - `headerDensity`: `compact`
  - `contentOffset`: 固定ヘッダーに隠れないための本文 top offset
  - `viewportCategory`: `mobile` | `desktop`
- Derived from: React Router location と layout class 定義
- Validation rules:
  - `showsBreadcrumb` は全対象ページで `false`
  - `contentOffset` は header height 以上であること

### 2. BrandHomeLink

- Purpose: ホームへ戻る単一導線としてのブランド領域
- Fields:
  - `destinationPath`: `/`
  - `includesIcon`: `true`
  - `includesServiceName`: `true`
  - `interactiveArea`: アイコンとサービス名をまとめた clickable region
  - `isVisible`: 全対象ページで `true`
- Validation rules:
  - destination は常に `/`
  - icon 単体ではなく、サービス名を含む単一リンクとして扱うこと

### 3. TopLevelNavItem

- Purpose: ヘッダーメニューに表示するトップレベル遷移先
- Fields:
  - `path`: `/cards/create` | `/cards` | `/review` | `/stats` | `/settings`
  - `label`: `学習カード登録` | `カード一覧` | `復習` | `統計` | `設定`
  - `isActive`: 現在 path と route 解決結果に基づく active 状態
  - `isVisibleInMenu`: 常に `true`
- Validation rules:
  - `/` は `TopLevelNavItem` に含めない
  - 既存の並び順と表示ラベルを維持する

### 4. PageContextSignal

- Purpose: breadcrumb 廃止後に現在地を示す本文側の文脈情報
- Fields:
  - `sourceType`: `page-heading` | `progress-header`
  - `label`: 画面名または進行文脈
  - `isRequired`: `true`
  - `routeScope`: 対応するトップレベル route
- Validation rules:
  - Home / CardList / CardCreate / Stats / Settings は `page-heading` を持つこと
  - Review は `ReviewProgressHeader` など progress-header 相当の文脈を持つこと

## Relationships

- `HeaderLayoutState` は 1 つの `BrandHomeLink` を持つ。
- `HeaderLayoutState` は 0..n 個の `TopLevelNavItem` を表示する。
- 各トップレベル route は少なくとも 1 つの `PageContextSignal` を持ち、breadcrumb の代替として機能する。

## State Transitions

1. Route transition:
   - `currentPath` が更新される
   - `currentPageLabel` と active nav item が再計算される
   - breadcrumb は表示されないまま維持される
2. Brand link activation:
   - 任意の route から `/` に client-side transition する
   - Home の `PageContextSignal` が表示される
3. Viewport change:
   - `viewportCategory` が切り替わる
   - compact header のまま nav wrapping と content offset が適用される

## Non-Persistent Impact

- API payload、DB schema、Prisma model の変更はない。
- localStorage や session storage の追加キーも不要。
*** Add File: c:\work\Forgetting_curve_ssd2\Forgetting_curve\specs\001-shrink-header-menu\contracts\header-navigation.md
# Header Navigation Contract

## Purpose

共通ヘッダー簡素化後も、トップレベル導線と現在地認識を一貫させるための UI 契約を定義する。

## Scope

- 対象: `AppLayout` を利用する全トップレベル route
- 非対象: backend API、DB schema、認証、権限制御

## Contract

### 1. Brand Region

- Header 左側のブランド領域は単一のホーム導線であること
- クリック可能領域にはアイコン相当表現とサービス名の両方を含めること
- 遷移先は常に `/` であること
- route transition は client-side navigation で行うこと

### 2. Top-Level Navigation Menu

- Header メニューに表示する項目は以下に限定すること
  - `学習カード登録` -> `/cards/create`
  - `カード一覧` -> `/cards`
  - `復習` -> `/review`
  - `統計` -> `/stats`
  - `設定` -> `/settings`
- `ホーム` はヘッダーメニューに表示しないこと
- 現在ページに対応する menu item は active state を持つこと
- 既存ラベル順序を維持すること

### 3. Current Page Context

- breadcrumb 専用領域は表示しないこと
- 各 route は本文先頭または進行ヘッダーで現在地を示すこと
- 少なくとも以下を満たすこと
  - Home: `ホーム` の見出し
  - CardList: `カード一覧` の見出し
  - CardCreate: `学習カード登録` の見出し
  - Stats: `統計` の見出し
  - Settings: `設定` の見出し
  - Review: `ReviewProgressHeader` など進行文脈で復習中であることを示す

### 4. Layout Spacing

- 固定ヘッダーの高さを縮小した後、本文先頭がヘッダーに隠れないこと
- desktop / mobile の双方で breadcrumb 削除後の compact header に対応した top offset を持つこと
- resize 監視や動的高さ測定に依存せず、静的 layout class で再現できること

## Acceptance Mapping

- `FR-001`, `FR-002`: breadcrumb を削除し compact header にする
- `FR-003`, `FR-007`: ブランド領域をホーム導線に統一し、ホームをメニューから除外する
- `FR-004`, `FR-009`: 本文側の見出しまたは progress header で現在地を補う
- `FR-006`, `FR-008`, `FR-010`: 全対象 route で desktop / mobile の spacing と導線を一貫適用する
- `FR-011`: 既存 route の動作は変えず、導線表現のみ変更する
*** Add File: c:\work\Forgetting_curve_ssd2\Forgetting_curve\specs\001-shrink-header-menu\quickstart.md
# Quickstart: 共通ヘッダー簡素化

## 1. Setup

1. ルートで依存関係をインストールする

```bash
npm install
```

2. 開発サーバーを起動する

```bash
npm run dev:server
npm run dev:client
```

## 2. Manual Verification

### Desktop

1. `/cards` を開き、breadcrumb 専用領域が表示されないことを確認する
2. Header メニューに `ホーム` が存在しないことを確認する
3. Header 左側のブランド領域をクリックし、`/` へ遷移できることを確認する
4. `/cards/create`, `/review`, `/stats`, `/settings` を順に開き、各ページで本文見出しまたは進行ヘッダーにより現在地を認識できることを確認する
5. どのページでも本文先頭が固定ヘッダーに隠れないことを確認する

### Mobile

1. ブラウザ幅をモバイル相当に縮める
2. Header が breadcrumb なしの compact layout になっていることを確認する
3. メニューの wrap 後も `学習カード登録`, `カード一覧`, `復習`, `統計`, `設定` に到達できることを確認する
4. ブランド領域からホームへ戻れることを確認する
5. 初回表示で本文や主要操作の見える範囲が従来より増えていることを確認する

## 3. Automated Checks

```bash
npm run lint
npm run test --workspaces
```

必要に応じてトップレベル導線の E2E スモークも実行する。

```bash
npm run test:e2e
```

## 4. Expected Test Coverage

- `AppLayout` またはルートメタデータに対する unit/UI テスト
  - breadcrumb が描画されない
  - ブランド領域が `/` へ遷移する
  - メニューから `ホーム` が除外される
- 必要に応じて E2E スモーク
  - `/stats` などからブランド領域経由でホームへ戻れる
  - compact header でも本文先頭が隠れない
