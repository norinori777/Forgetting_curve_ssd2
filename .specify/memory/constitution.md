# Forgetting_curve_ssd2 Constitution
<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles: (new) Accuracy → Continuity → Privacy → Explainability → Reliability (defined)
- Added sections: 言語とコミュニケーション、スコープ境界、品質基準、変更の進め方
- Removed sections: none
- Templates requiring review: .specify/templates/plan-template.md (⚠ pending), .specify/templates/spec-template.md (⚠ pending), .specify/templates/tasks-template.md (⚠ pending)
- Follow-up TODOs: review templates for constitution checks and add Japanese PR/Issue templates if desired
-->

## Core Principles

### 1. 正確性（Accuracy） — 最優先（NON-NEGOTIABLE）

復習スケジューリングと想起評価の正確性を最優先とする。誤った推奨は学習成果を直接損なうため、必要に応じて追加の検証・説明・テストを課す。アルゴリズムの変更はベンチマークデータで効果を示すこと。

### 2. 継続性・UX（Continuity & UX）

ユーザーが継続して学習できる体験を提供する。主要フロー（カード追加→復習開始→結果記録）を最短に保ち、オンボーディングや通知が学習の継続を阻害しないことを重視する。

### 3. プライバシーとデータ最小化（Privacy & Minimal Data）

収集するデータは最小限とし、ローカルファーストの取り扱いを優先する。ユーザーは自身の学習データをエクスポート／完全削除できることを保証する。分析用途は匿名化・集約で行う。

### 4. 説明可能性（Explainability）

スケジューリングの根拠をユーザーに簡潔に提示できること。なぜそのタイミングで復習を推奨するのかを表示し、ユーザーが納得した上で行動できるようにする。

### 5. 信頼性・セキュリティ（Reliability & Security）

データ整合性と可用性を重視する。クラッシュやデータ消失を防ぐ設計（自動バックアップ、同期のフォールバック、暗号化など）を必須とする。セキュリティ対策は原則として標準ベストプラクティスに従う。

## Operational Constraints & Scope

- スコープ（やること）: 基本的なフラッシュカード作成・編集・タグ付け、インポート/エクスポート、忘却曲線（間隔反復）に基づく自動スケジューリング、想起履歴と次回推奨日時の記録、シンプルな復習UI、最小限のオフライン対応、データエクスポート／削除機能。
- 非スコープ（やらないこと）: 大規模なソーシャル機能、企業向け大規模分析プラットフォーム、複雑なゲーム化、大量の自動コンテンツ生成（初期フェーズでは除外）。
- 言語運用: ドキュメント、PR/Issue、レビューコメントは日本語を一次言語とする。国際公開が必要な場合は簡潔な英語サマリを添付する。

## Development Workflow & Quality Gates

- Definition of Done (必須チェック)
  - テスト: ユニット（スケジューラ、復習判定、保存/同期）と統合（同期・バックアップ）、E2E（主要コアループ）の確認。新機能は少なくとも1つの自動テストを追加。
  - 型・静的解析: TypeScript (`tsc`/`eslint`)、Python (`mypy`/`ruff`)、Java (`mvn`/`gradle` + Checkstyle/SpotBugs/PMD/ErrorProne/spotless) 等の静的チェックを CI で実行し、警告・エラーを解消する。
  - ドキュメント: ユーザー向け（オンボーディング、プライバシー、エクスポート/削除手順）と開発者向け（API/データモデル、マイグレーション）を更新。
  - エラー処理: 入力検証、ユーザー向け明瞭なエラーメッセージ、ネットワーク失敗時のリトライとローカルフォールバック。
  - ログ: 構造化ログ（JSON 等）、`INFO/ERROR/DEBUG` レベルの遵守、PII のログ出力禁止。

- PR とレビュー
  - 1 PR = 1 意図。可能なら 200 行未満を目安に分割。最低1名レビュー、設計/アルゴリズム/依存追加は2名以上推奨。
  - PR テンプレート（日本語）を用意し、DoD チェックリストを埋めること。

- ブランチとマージ
  - `main` は保護ブランチ（CI とレビュー必須）。機能は `feature/...`、バグは `fix/...`、ホットフィックスは `hotfix/...` を使用。
  - マージ方式は原則 `squash and merge`。履歴保存が必要な場合は運用で合意して `merge commit` を許可。

- リリースとバージョニング
  - SemVer を採用。リリースは `release` ブランチで QA → タグ付け（`vX.Y.Z`）→ デプロイ。

## Governance

- 憲法の改定: 憲法改定は PR と合意（少なくとも 1 名のプロジェクトリーダー承認）を要する。改定には改定理由、影響範囲、移行計画（必要な場合）を含める。
- 変更管理: この憲法はプロジェクトの最上位ガイドラインとする。重要な逸脱は ADR（設計決定記録）として残し、次回改定時に見直す。

**Version**: 1.0.0 | **Ratified**: 2026-03-07 | **Last Amended**: 2026-03-07

