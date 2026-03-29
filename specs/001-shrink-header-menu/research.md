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