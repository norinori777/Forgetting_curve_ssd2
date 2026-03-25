import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AsyncState } from '../components/uiParts/AsyncState';
import { RetryBanner } from '../components/uiParts/RetryBanner';
import { HomePrimaryActions } from '../components/uniqueParts/HomePrimaryActions';
import { HomeRecentActivities } from '../components/uniqueParts/HomeRecentActivities';
import { HomeStatePanel } from '../components/uniqueParts/HomeStatePanel';
import { HomeSummaryCard } from '../components/uniqueParts/HomeSummaryCard';
import type { HomeDashboardResponse } from '../domain/home';
import type { CardListFilter } from '../domain/cardList';
import { fetchHomeDashboard, HomeApiError } from '../services/api/homeApi';
import { startReview } from '../services/api/reviewApi';
import { buildReviewSessionPath } from '../utils/routes/reviewSession';
import { cacheReviewSessionSnapshot, clearPendingReviewStartFilter, setActiveReviewSessionId, setPendingReviewStartFilter } from '../utils/reviewSessionStorage';

const todayReviewFilter: CardListFilter = {
  sort: 'next_review_at',
  filter: 'today',
  tagIds: [],
  collectionIds: [],
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function Home() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<HomeDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingReview, setStartingReview] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const nextDashboard = await fetchHomeDashboard();
      setDashboard(nextDashboard);
    } catch (cause) {
      setError(getErrorMessage(cause, 'home_temporary_failure'));
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function handleStartReview() {
    setStartingReview(true);
    setPendingReviewStartFilter(todayReviewFilter);

    try {
      const result = await startReview(todayReviewFilter);
      clearPendingReviewStartFilter();
      setActiveReviewSessionId(result.snapshot.sessionId);
      cacheReviewSessionSnapshot(result.snapshot);
      void navigate(buildReviewSessionPath({ sessionId: result.snapshot.sessionId }));
    } catch (cause) {
      if (cause instanceof HomeApiError) {
        setError(getErrorMessage(cause, 'review_temporary_failure'));
      }

      if (cause instanceof Error && 'status' in cause) {
        const status = Number((cause as { status?: unknown }).status);
        if (status === 404) {
          void navigate(buildReviewSessionPath({ state: 'empty' }));
          return;
        }

        void navigate(buildReviewSessionPath({ state: 'start-error' }));
        return;
      }

      setError(getErrorMessage(cause, 'review_temporary_failure'));
    } finally {
      setStartingReview(false);
    }
  }

  const canStartReview = (dashboard?.summary.todayDueCount ?? 0) > 0 && !dashboard?.state.firstUse;

  return (
    <section className="space-y-6 py-8" aria-labelledby="home-page-title">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Home</p>
        <h1 id="home-page-title" className="text-4xl font-semibold text-text-primary">
          ホーム
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-text-secondary">今日の学習状況、主要導線、最近のイベントをひと目で確認し、次の学習へすぐ進めます。</p>
      </header>

      {error && dashboard ? <RetryBanner message={error} onRetry={loadDashboard} /> : null}

      {loading && !dashboard ? (
        <AsyncState kind="loading" title="ホーム画面を読み込み中" description="今日の学習状況と最近のアクティビティを取得しています。" />
      ) : null}

      {!loading && !dashboard && error ? (
        <HomeStatePanel
          kind="error"
          title="ホーム情報の取得に失敗しました。"
          description="通信状態を確認して再試行してください。復習開始や各画面への移動は共通ナビゲーションからも行えます。"
          actions={[
            { label: '再試行', onClick: loadDashboard, emphasis: 'primary' },
            { label: 'カード一覧へ', to: '/cards' },
          ]}
        />
      ) : null}

      {dashboard ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="home-summary-grid">
            <HomeSummaryCard label="今日の復習対象" value={dashboard.summary.todayDueCount} description="今日の復習として開始できるカード数です。" testId="home-summary-today" />
            <HomeSummaryCard label="期限超過" value={dashboard.summary.overdueCount} description="すでに期限を過ぎている復習対象の件数です。" testId="home-summary-overdue" />
            <HomeSummaryCard label="未学習" value={dashboard.summary.unlearnedCount} description="まだ 1 度も復習していない学習カード数です。" testId="home-summary-unlearned" />
            <HomeSummaryCard label="連続学習日数" value={dashboard.summary.streakDays} description="今日まで連続して学習を続けている日数です。" testId="home-summary-streak" />
          </section>

          {dashboard.state.firstUse ? (
            <HomeStatePanel
              kind="first-use"
              title="最初の学習カードを登録しましょう。"
              description="学習カードがまだありません。最初の 1 枚を登録すると、ホームの summary と復習導線が有効になります。"
              actions={[
                { label: '学習カード登録へ', to: '/cards/create', emphasis: 'primary' },
                { label: 'カード一覧へ', to: '/cards' },
              ]}
            />
          ) : null}

          {!dashboard.state.firstUse && dashboard.state.noReviewToday ? (
            <HomeStatePanel
              kind="no-review"
              title="今日の復習対象はありません。"
              description="今日の復習は完了しています。カード一覧を見直すか、新しい学習カードを登録して次の学習を準備できます。"
              actions={[
                { label: 'カード一覧を見る', to: '/cards', emphasis: 'primary' },
                { label: '学習カード登録へ', to: '/cards/create' },
              ]}
            />
          ) : null}

          <HomePrimaryActions busy={startingReview} canStartReview={canStartReview} onStartReview={handleStartReview} />
          <HomeRecentActivities activities={dashboard.recentActivities} />
        </>
      ) : null}
    </section>
  );
}