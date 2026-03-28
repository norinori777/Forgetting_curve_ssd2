import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { AsyncState } from '../components/uiParts/AsyncState';
import { RetryBanner } from '../components/uiParts/RetryBanner';
import { StatsInsightPanel } from '../components/uniqueParts/StatsInsightPanel';
import { StatsRangeTabs } from '../components/uniqueParts/StatsRangeTabs';
import { StatsSummaryCard } from '../components/uniqueParts/StatsSummaryCard';
import { StatsTagBreakdown } from '../components/uniqueParts/StatsTagBreakdown';
import { StatsTrendPanel } from '../components/uniqueParts/StatsTrendPanel';
import type { StatisticsDashboardResponse, StatisticsRange, SummaryMetric, StreakMetric } from '../domain/stats';
import { fetchStatsDashboard } from '../services/api/statsApi';
import { cacheStatsDashboard, getCachedStatsDashboard } from '../utils/statsDashboardStorage';

const defaultRange: StatisticsRange = '7d';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function formatMetricValue(metric: SummaryMetric | StreakMetric | null): string {
  if (!metric) return '--';
  if (metric.unit === 'percent') return `${Math.round(metric.value)}%`;
  if (metric.unit === 'days') return `${Math.round(metric.value)}日`;
  return Math.round(metric.value).toLocaleString('ja-JP');
}

function formatMetricHint(metric: SummaryMetric | StreakMetric | null): string {
  if (!metric) return 'レビュー回答がまだありません。';
  if (metric.displayHint) return metric.displayHint;
  if ('bestRecordDays' in metric) {
    return metric.bestRecordDays && metric.bestRecordDays > 0 ? `最高記録 ${metric.bestRecordDays}日` : '最高記録はまだありません';
  }
  return '前期間比はまだありません。';
}

export function Stats() {
  const [selectedRange, setSelectedRange] = useState<StatisticsRange>(defaultRange);
  const [dashboard, setDashboard] = useState<StatisticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  async function loadDashboard(range = selectedRange) {
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      const nextDashboard = await fetchStatsDashboard(range);
      setDashboard(nextDashboard);
      cacheStatsDashboard(nextDashboard);
    } catch (cause) {
      const cached = getCachedStatsDashboard(range);
      if (cached) {
        setDashboard(cached.snapshot);
        setUsingFallback(true);
        setError('最新の統計を取得できなかったため、前回取得した統計を表示しています。');
      } else {
        setDashboard(null);
        setError(getErrorMessage(cause, 'stats_temporary_failure'));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard(selectedRange);
  }, [selectedRange]);

  return (
    <section className="space-y-6 py-8" aria-labelledby="stats-page-title">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Stats</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 id="stats-page-title" className="text-4xl font-semibold text-text-primary">
              統計
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-text-secondary">学習サマリー、期間ごとの推移、タグ別の弱点をまとめて確認できます。</p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard(selectedRange)}
            className="rounded-full border border-border-subtle bg-surface-panel px-4 py-2 text-sm font-medium text-text-primary"
          >
            更新
          </button>
        </div>
      </header>

      {error && dashboard ? <RetryBanner message={error} onRetry={() => loadDashboard(selectedRange)} /> : null}

      {loading && !dashboard ? (
        <AsyncState kind="loading" title="統計を読み込み中" description="学習サマリー、推移、タグ別内訳を取得しています。" />
      ) : null}

      {!loading && !dashboard && error ? (
        <section className="space-y-4 rounded-[28px] border border-border-subtle bg-surface-panel p-6 md:p-8" aria-live="assertive">
          <RetryBanner message="統計情報を取得できませんでした。" onRetry={() => loadDashboard(selectedRange)} />
          <p className="text-sm leading-6 text-text-secondary">ネットワークまたはサーバーの状態を確認して、もう一度お試しください。</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void loadDashboard(selectedRange)} className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
              再試行
            </button>
            <Link to="/cards" className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
              カード一覧へ
            </Link>
          </div>
        </section>
      ) : null}

      {dashboard ? (
        <>
          <section className="space-y-4 rounded-[28px] border border-border-subtle bg-surface-panel p-6 md:p-8">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">統計サマリー</p>
              </div>
              <StatsRangeTabs selectedRange={selectedRange} onSelect={setSelectedRange} disabled={loading} />
            </div>

            {dashboard.state.mode === 'empty' ? (
              <div className="rounded-[28px] border border-dashed border-border-subtle bg-surface-base px-6 py-8" aria-live="polite">
                <h2 className="text-2xl font-semibold text-text-primary">まだ統計を表示できるだけの学習履歴がありません</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">{dashboard.state.message}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to="/cards/create" className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
                    学習カードを追加
                  </Link>
                  <Link to="/review" className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
                    復習画面を見る
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="stats-summary-grid">
                  <StatsSummaryCard
                    label="総学習カード数"
                    value={formatMetricValue(dashboard.summary.totalCardCount)}
                    hint={formatMetricHint(dashboard.summary.totalCardCount)}
                    description="現在アクティブな学習カード数です。"
                    testId="stats-summary-total-cards"
                  />
                  <StatsSummaryCard
                    label="レビュー完了数"
                    value={formatMetricValue(dashboard.summary.completedReviewCount)}
                    hint={formatMetricHint(dashboard.summary.completedReviewCount)}
                    description="選択中期間に記録されたレビュー回答数です。"
                    testId="stats-summary-completed-review"
                  />
                  <StatsSummaryCard
                    label="平均正答率"
                    value={formatMetricValue(dashboard.summary.averageAccuracy)}
                    hint={formatMetricHint(dashboard.summary.averageAccuracy)}
                    description="選択中期間のレビュー回答だけで計算した正答率です。"
                    testId="stats-summary-average-accuracy"
                  />
                  <StatsSummaryCard
                    label="連続学習日数"
                    value={formatMetricValue(dashboard.summary.streakDays)}
                    hint={formatMetricHint(dashboard.summary.streakDays)}
                    description="1日に1回以上レビューした日数の連続です。"
                    testId="stats-summary-streak"
                  />
                </section>

                {dashboard.state.mode === 'partial' ? (
                  <div className="rounded-[24px] border border-dashed border-border-subtle bg-surface-base px-5 py-4 text-sm text-text-secondary" aria-live="polite">
                    <p className="font-medium text-text-primary">一部の統計を表示できません</p>
                    <p className="mt-2">{dashboard.state.message}</p>
                  </div>
                ) : null}

                <StatsTrendPanel title="学習量の推移" description="レビュー完了数の増減がひと目で分かります。" series={dashboard.volumeTrend} testId="stats-volume-trend" />

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <StatsTrendPanel
                    title="正答率の推移"
                    description="選択中期間の定着状況を追えます。"
                    series={dashboard.accuracyTrend}
                    testId="stats-accuracy-trend"
                    emptyMessage="正答率の履歴はまだありません。"
                  />
                  <StatsTagBreakdown items={dashboard.tagBreakdown} />
                </div>

                <StatsInsightPanel items={dashboard.insights} isStale={usingFallback} />
              </>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}