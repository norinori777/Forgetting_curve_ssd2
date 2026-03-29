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