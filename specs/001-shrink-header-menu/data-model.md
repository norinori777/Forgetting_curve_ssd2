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