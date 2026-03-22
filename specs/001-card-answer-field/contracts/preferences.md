# preferences.md

## Client Preference Contract

### Storage key

- Key: `fc.cardList.answerDisplayMode`

### Allowed values

- `link`: 回答ありカードは一覧初期表示で「回答を表示」リンクを出す
- `inline`: 回答ありカードは一覧初期表示で回答本文を出す

### Fallback rule

- キー未設定、空文字、未知値、読み取り失敗時は `link` を採用する

### Read timing

- カード一覧画面の初回表示時に参照する
- 一覧データを再取得して表示を再構成するタイミングで再参照する

### Non-goals in this feature

- このキーを書き換える UI は追加しない
- サーバ同期や複数端末同期は扱わない