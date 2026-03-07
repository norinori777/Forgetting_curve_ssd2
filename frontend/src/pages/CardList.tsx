import { useEffect, useMemo, useRef, useState } from 'react';

import { CardItem } from '../components/CardItem';
import { CollectionSelector } from '../components/CollectionSelector';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { SearchBar } from '../components/SearchBar';
import { SelectionBar } from '../components/SelectionBar';
import { TodayFilter } from '../components/filters/TodayFilter';
import { StartReviewButton } from '../components/StartReviewButton';
import { TagFilter } from '../components/TagFilter';
import { useSelection } from '../hooks/useSelection';
import { bulkAction } from '../services/bulkService';

export type ApiCard = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  collectionId: string | null;
  proficiency: number;
  nextReviewAt: string;
  lastCorrectRate: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

type ListCardsResponse = {
  items: ApiCard[];
  nextCursor?: string;
};

type ReviewStartResponse = {
  sessionId: string;
  cardIds: string[];
};

type ExtraFilter = 'none' | 'overdue' | 'unlearned';
type SortKey = 'next_review_at' | 'proficiency' | 'created_at';

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim().length > 0) return err;
  return fallback;
}

function resolveExtraFilter(value: string): ExtraFilter {
  if (value === 'none' || value === 'overdue' || value === 'unlearned') return value;
  return 'none';
}

function resolveSort(value: string): SortKey {
  if (value === 'next_review_at' || value === 'proficiency' || value === 'created_at') return value;
  return 'next_review_at';
}

export function CardList() {
  const [todayOnly, setTodayOnly] = useState(false);
  const [extraFilter, setExtraFilter] = useState<ExtraFilter>('none');
  const [sort, setSort] = useState<SortKey>('next_review_at');
  const [q, setQ] = useState('');
  const [tags, setTags] = useState('');
  const [collection, setCollection] = useState('');

  const [cards, setCards] = useState<ApiCard[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const [initialLoading, setInitialLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);

  const [initialError, setInitialError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);

  const [reviewSession, setReviewSession] = useState<ReviewStartResponse | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);

  const selection = useSelection(cards);

  const filterParam = useMemo(() => {
    if (todayOnly) return 'today';
    if (extraFilter !== 'none') return extraFilter;
    return undefined;
  }, [todayOnly, extraFilter]);

  const queryKey = useMemo(() => {
    return JSON.stringify({ filterParam, sort, q, tags, collection });
  }, [filterParam, sort, q, tags, collection]);

  async function fetchPage(cursor?: string) {
    const params = new URLSearchParams();
    params.set('limit', '50');
    params.set('sort', sort);
    if (cursor) params.set('cursor', cursor);
    if (filterParam) params.set('filter', filterParam);
    if (q.trim().length > 0) params.set('q', q.trim());
    if (tags.trim().length > 0) params.set('tags', tags.trim());
    if (collection.trim().length > 0) params.set('collection', collection.trim());

    const res = await fetch(`/api/cards?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as ListCardsResponse;
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setInitialLoading(true);
      setInitialError(null);
      setMoreError(null);
      setReviewSession(null);

      try {
        const data = await fetchPage();
        if (cancelled) return;
        setCards(data.items ?? []);
        setNextCursor(data.nextCursor);
      } catch (e: unknown) {
        if (cancelled) return;
        setInitialError(getErrorMessage(e, 'failed to load'));
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    if (!nextCursor) return;
    if (initialLoading || moreLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!nextCursor) return;

        setMoreLoading(true);
        setMoreError(null);

        void fetchPage(nextCursor)
          .then((data) => {
            setCards((prev) => [...prev, ...(data.items ?? [])]);
            setNextCursor(data.nextCursor);
          })
          .catch((e: unknown) => {
            setMoreError(getErrorMessage(e, 'failed to load more'));
          })
          .finally(() => {
            setMoreLoading(false);
          });
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [nextCursor, initialLoading, moreLoading, queryKey]);

  async function retryInitial() {
    setInitialLoading(true);
    setInitialError(null);

    try {
      const data = await fetchPage();
      setCards(data.items ?? []);
      setNextCursor(data.nextCursor);
    } catch (e: unknown) {
      setInitialError(getErrorMessage(e, 'failed to load'));
    } finally {
      setInitialLoading(false);
    }
  }

  async function startReview() {
    setMoreError(null);

    try {
      const apiFilter = {
        sort,
        filter: filterParam,
        q: q.trim().length > 0 ? q.trim() : undefined,
        tags: tags.trim().length > 0 ? tags.trim() : undefined,
        collection: collection.trim().length > 0 ? collection.trim() : undefined,
      };

      const res = await fetch('/api/review/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ filter: apiFilter }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ReviewStartResponse;
      setReviewSession(data);
    } catch (e: unknown) {
      setMoreError(getErrorMessage(e, 'failed to start review'));
    }
  }

  async function bulkArchive() {
    if (selection.selectedIds.size === 0) return;
    setBulkWorking(true);
    setMoreError(null);

    try {
      await bulkAction('archive', Array.from(selection.selectedIds));
      selection.clear();
      await retryInitial();
    } catch (e: unknown) {
      setMoreError(getErrorMessage(e, 'failed to archive'));
    } finally {
      setBulkWorking(false);
    }
  }

  async function confirmBulkDelete() {
    if (selection.selectedIds.size === 0) return;
    setBulkWorking(true);
    setMoreError(null);

    try {
      await bulkAction('delete', Array.from(selection.selectedIds));
      setDeleteModalOpen(false);
      selection.clear();
      await retryInitial();
    } catch (e: unknown) {
      setMoreError(getErrorMessage(e, 'failed to delete'));
    } finally {
      setBulkWorking(false);
    }
  }

  function resetFilters() {
    setTodayOnly(false);
    setExtraFilter('none');
    setSort('next_review_at');
    setQ('');
    setTags('');
    setCollection('');
  }

  return (
    <main>
      <h1>カード一覧</h1>

      <section aria-label="filters">
        <TodayFilter value={todayOnly} onChange={setTodayOnly} />

        <label>
          追加フィルタ
          <select
            value={extraFilter}
            onChange={(e) => setExtraFilter(resolveExtraFilter(e.currentTarget.value))}
            disabled={todayOnly}
          >
            <option value="none">なし</option>
            <option value="overdue">期限切れ</option>
            <option value="unlearned">未学習</option>
          </select>
        </label>

        <SearchBar value={q} onDebouncedChange={setQ} />
        <TagFilter value={tags} onChange={setTags} />
        <CollectionSelector value={collection} onChange={setCollection} />

        <label>
          ソート
          <select value={sort} onChange={(e) => setSort(resolveSort(e.currentTarget.value))}>
            <option value="next_review_at">次回復習日時</option>
            <option value="proficiency">習熟度</option>
            <option value="created_at">作成日</option>
          </select>
        </label>
      </section>

      <section aria-label="actions">
        <StartReviewButton disabled={cards.length === 0 || initialLoading} onClick={startReview} />
      </section>

      <SelectionBar
        selectedCount={selection.selectedIds.size}
        onArchive={bulkArchive}
        onDelete={() => setDeleteModalOpen(true)}
      />

      {initialError ? (
        <div role="alert">
          <p>Error: {initialError}</p>
          <button type="button" onClick={() => void retryInitial()}>
            再試行
          </button>
        </div>
      ) : null}

      {initialLoading ? <p>Loading...</p> : null}

      {reviewSession ? (
        <section aria-label="review-session">
          <p>
            sessionId: <span data-testid="session-id">{reviewSession.sessionId}</span>
          </p>
          <p>
            cards: <span data-testid="session-count">{reviewSession.cardIds.length}</span>
          </p>
        </section>
      ) : null}

      <section aria-label="card-list">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            selected={selection.isSelected(card.id)}
            onToggleSelected={() => selection.toggle(card.id)}
          />
        ))}

        {!initialLoading && !initialError && cards.length === 0 ? (
          <div>
            <p>条件に一致するカードがありません。</p>
            <button type="button" onClick={resetFilters}>
              条件をリセット
            </button>
          </div>
        ) : null}

        {moreError ? <p role="alert">Error: {moreError}</p> : null}
        {moreLoading ? <p>Loading more...</p> : null}

        <div ref={sentinelRef} aria-hidden="true" />
      </section>

      <DeleteConfirmModal
        open={deleteModalOpen}
        items={selection.selectedItems.map((c) => ({ id: c.id, title: c.title }))}
        onConfirm={confirmBulkDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

      {bulkWorking ? <p>Working...</p> : null}
    </main>
  );
}
