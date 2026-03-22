import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AsyncState } from '../components/uiParts/AsyncState';
import { ReviewProgressHeader } from '../components/uiParts/ReviewProgressHeader';
import { RetryBanner } from '../components/uiParts/RetryBanner';
import { ReviewAssessmentControls } from '../components/uniqueParts/ReviewAssessmentControls';
import { ReviewCompletionSummary } from '../components/uniqueParts/ReviewCompletionSummary';
import { REVIEW_SHORTCUTS, type ReviewAssessment, type ReviewSessionSnapshot } from '../domain/review';
import { getReviewSession, navigateReviewSession, ReviewApiError, saveReviewAssessment, startReview } from '../services/api/reviewApi';
import {
  cacheReviewSessionSnapshot,
  clearActiveReviewSessionId,
  clearPendingReviewAssessment,
  clearPendingReviewStartFilter,
  getActiveReviewSessionId,
  getCachedReviewSessionSnapshot,
  getPendingReviewAssessment,
  getPendingReviewStartFilter,
  setActiveReviewSessionId,
  setPendingReviewAssessment,
} from '../utils/reviewSessionStorage';
import { buildReviewSessionPath, getReviewSessionIdFromSearch, getReviewViewStateFromSearch } from '../utils/routes/reviewSession';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

export function Review() {
  const location = useLocation();
  const navigate = useNavigate();
  const viewState = getReviewViewStateFromSearch(location.search);
  const sessionIdFromQuery = getReviewSessionIdFromSearch(location.search);
  const resolvedSessionId = sessionIdFromQuery ?? getActiveReviewSessionId();

  const [snapshot, setSnapshot] = useState<ReviewSessionSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedMode, setCachedMode] = useState(false);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const currentCard = snapshot?.currentCard ?? null;

  useEffect(() => {
    setAnswerVisible(false);
  }, [currentCard?.cardId]);

  async function retryStartFromStoredFilter() {
    const filter = getPendingReviewStartFilter();
    if (!filter) {
      setError('復習開始条件が見つかりません。');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await startReview(filter);
      clearPendingReviewStartFilter();
      setActiveReviewSessionId(result.snapshot.sessionId);
      cacheReviewSessionSnapshot(result.snapshot);
      setSnapshot(result.snapshot);
      navigate(buildReviewSessionPath({ sessionId: result.snapshot.sessionId }), { replace: true });
    } catch (cause) {
      setError(getErrorMessage(cause, 'failed to start review'));
    } finally {
      setLoading(false);
    }
  }

  async function syncPendingAssessment(sessionId: string, currentSnapshot: ReviewSessionSnapshot | null): Promise<boolean> {
    const pending = getPendingReviewAssessment(sessionId);
    if (!pending || !currentSnapshot?.currentCard) return false;
    if (pending.cardId !== currentSnapshot.currentCard.cardId || currentSnapshot.currentCard.locked) {
      clearPendingReviewAssessment(sessionId);
      return false;
    }

    try {
      const nextSnapshot = await saveReviewAssessment(sessionId, { cardId: pending.cardId, assessment: pending.assessment });
      clearPendingReviewAssessment(sessionId);
      cacheReviewSessionSnapshot(nextSnapshot);
      setSnapshot(nextSnapshot);
      setSyncNotice('未同期の評価を再送しました。');
      return true;
    } catch {
      return false;
    }
  }

  async function loadSnapshot(sessionId: string) {
    setLoading(true);
    setError(null);
    setCachedMode(false);

    try {
      const nextSnapshot = await getReviewSession(sessionId);
      setSnapshot(nextSnapshot);
      cacheReviewSessionSnapshot(nextSnapshot);
      if (nextSnapshot.status === 'completed') {
        clearActiveReviewSessionId();
      } else {
        setActiveReviewSessionId(nextSnapshot.sessionId);
      }
      await syncPendingAssessment(sessionId, nextSnapshot);
    } catch (cause) {
      const cached = getCachedReviewSessionSnapshot(sessionId);
      if (cached) {
        setSnapshot(cached.snapshot);
        setCachedMode(true);
        setError('通信に失敗したため、最後に取得した内容を表示しています。');
      } else {
        setError(getErrorMessage(cause, 'failed to load review session'));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (resolvedSessionId) {
      void loadSnapshot(resolvedSessionId);
      return;
    }

    if (viewState === 'start-error') {
      setSnapshot(null);
      setError('復習の開始に失敗しました。再試行してください。');
      return;
    }

    if (viewState === 'empty') {
      setSnapshot(null);
      setError(null);
      return;
    }

    setSnapshot(null);
  }, [resolvedSessionId, viewState]);

  async function handleAssessment(assessment: ReviewAssessment) {
    if (!snapshot?.currentCard || !resolvedSessionId || snapshot.currentCard.locked) return;

    setError(null);
    setSyncNotice(null);

    try {
      const nextSnapshot = await saveReviewAssessment(resolvedSessionId, { cardId: snapshot.currentCard.cardId, assessment });
      clearPendingReviewAssessment(resolvedSessionId);
      setSnapshot(nextSnapshot);
      cacheReviewSessionSnapshot(nextSnapshot);
    } catch (cause) {
      if (cause instanceof ReviewApiError && cause.status === 503) {
        const optimisticSnapshot: ReviewSessionSnapshot = {
          ...snapshot,
          currentCard: snapshot.currentCard
            ? {
                ...snapshot.currentCard,
                currentAssessment: assessment,
              }
            : null,
        };
        setSnapshot(optimisticSnapshot);
        cacheReviewSessionSnapshot(optimisticSnapshot);
        setPendingReviewAssessment({
          sessionId: resolvedSessionId,
          cardId: snapshot.currentCard.cardId,
          assessment,
          queuedAt: new Date().toISOString(),
          basedOnIndex: snapshot.currentIndex,
        });
        setSyncNotice('評価を一時保存しました。通信回復後に再送します。');
        return;
      }

      setError(getErrorMessage(cause, 'failed to save assessment'));
    }
  }

  async function handleNavigation(direction: 'prev' | 'next') {
    if (!resolvedSessionId || !snapshot) return;

    if (direction === 'next') {
      const pending = getPendingReviewAssessment(resolvedSessionId);
      if (pending) {
        const synced = await syncPendingAssessment(resolvedSessionId, snapshot);
        if (!synced) {
          setError('未同期の評価があります。再試行してください。');
          return;
        }
      }
    }

    setError(null);
    setSyncNotice(null);

    try {
      const nextSnapshot = await navigateReviewSession(resolvedSessionId, direction);
      setSnapshot(nextSnapshot);
      cacheReviewSessionSnapshot(nextSnapshot);
      if (nextSnapshot.status === 'completed') {
        clearActiveReviewSessionId();
      }
    } catch (cause) {
      setError(getErrorMessage(cause, 'failed to move review card'));
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!snapshot?.currentCard || isTypingTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key.toLowerCase() === 'v') {
        event.preventDefault();
        setAnswerVisible(true);
        return;
      }

      if (!answerVisible || snapshot.currentCard.locked) return;
      if (event.key in REVIEW_SHORTCUTS) {
        event.preventDefault();
        void handleAssessment(REVIEW_SHORTCUTS[event.key as keyof typeof REVIEW_SHORTCUTS]);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answerVisible, snapshot]);

  const content = useMemo(() => {
    if (viewState === 'empty' && !resolvedSessionId) {
      return (
        <AsyncState
          kind="empty"
          title="復習対象のカードがありません。"
          description="条件を見直すか、カード一覧へ戻って別の条件で開始してください。"
          action={{ label: 'カード一覧へ戻る', onClick: () => navigate('/cards') }}
        />
      );
    }

    if (viewState === 'start-error' && !resolvedSessionId && !snapshot) {
      return (
        <AsyncState
          kind="empty"
          title="復習の開始に失敗しました。"
          description="通信状態を確認して再試行するか、カード一覧へ戻ってください。"
          action={{ label: loading ? '再試行中...' : '再試行', onClick: () => void retryStartFromStoredFilter() }}
        />
      );
    }

    if (loading && !snapshot) {
      return <AsyncState kind="loading" title="復習セッションを読み込み中" description="前回の続きと現在のカードを取得しています。" />;
    }

    if (snapshot?.status === 'completed') {
      return <ReviewCompletionSummary summary={snapshot.summary} onBackToList={() => navigate('/cards')} />;
    }

    if (!snapshot?.currentCard) {
      return (
        <AsyncState
          kind="empty"
          title="進行中の復習セッションがありません。"
          description="カード一覧から復習を開始してください。"
          action={{ label: 'カード一覧へ戻る', onClick: () => navigate('/cards') }}
        />
      );
    }

    return (
      <div className="space-y-5">
        <ReviewProgressHeader snapshot={snapshot} />

        <section className="rounded-[28px] border border-border-subtle bg-surface-panel p-6" aria-label="review-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Question</p>
              <h2 className="mt-2 text-3xl font-semibold text-text-primary">{snapshot.currentCard.title}</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
              {snapshot.currentCard.collectionLabel ? <span className="rounded-full bg-surface-base px-3 py-1">{snapshot.currentCard.collectionLabel}</span> : null}
              {snapshot.currentCard.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-brand-secondary px-3 py-1 text-text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-text-primary">{snapshot.currentCard.content}</p>

          <div className="mt-6 rounded-3xl bg-surface-base px-5 py-4">
            <p className="text-xs uppercase tracking-[0.12em] text-text-muted">回答</p>
            {answerVisible ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-primary">{snapshot.currentCard.answer ?? '未登録'}</p>
            ) : (
              <p className="mt-2 text-sm text-text-secondary">まずは自力で思い出してから回答を表示してください。ショートカット: V</p>
            )}
          </div>

          {snapshot.currentCard.nextReviewAt ? (
            <p className="mt-4 text-xs text-text-secondary">次回復習予定: {new Date(snapshot.currentCard.nextReviewAt).toLocaleString()}</p>
          ) : null}
        </section>

        <ReviewAssessmentControls
          answerVisible={answerVisible}
          locked={snapshot.currentCard.locked}
          currentAssessment={snapshot.currentCard.currentAssessment}
          canGoPrev={snapshot.canGoPrev}
          canGoNext={snapshot.canGoNext}
          onRevealAnswer={() => setAnswerVisible(true)}
          onSelectAssessment={(assessment) => void handleAssessment(assessment)}
          onPrev={() => void handleNavigation('prev')}
          onNext={() => void handleNavigation('next')}
          onBackToList={() => navigate('/cards')}
        />
      </div>
    );
  }, [answerVisible, loading, navigate, resolvedSessionId, snapshot, viewState]);

  return (
    <section className="space-y-4 py-8" aria-label="review-page">
      {cachedMode && error ? <RetryBanner message={error} onRetry={() => resolvedSessionId ? loadSnapshot(resolvedSessionId) : retryStartFromStoredFilter()} /> : null}
      {!cachedMode && error ? <RetryBanner message={error} onRetry={() => resolvedSessionId ? loadSnapshot(resolvedSessionId) : retryStartFromStoredFilter()} /> : null}
      {syncNotice ? (
        <div role="status" className="rounded-2xl bg-status-success/10 px-4 py-3 text-sm text-status-success">
          {syncNotice}
        </div>
      ) : null}
      {content}
    </section>
  );
}