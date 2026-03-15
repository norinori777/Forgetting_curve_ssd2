import { useEffect, useMemo, useRef, useState } from 'react';

import type { ApiCard, CardFilterKey, CardListFilter } from '../domain/cardList';
import { bulkAction } from '../services/api/bulkApi';
import { fetchCards } from '../services/api/cardListApi';
import { fetchCollectionOptions, fetchTagOptions } from '../services/api/filterOptionsApi';
import { startReview as startReviewRequest } from '../services/api/reviewApi';
import { AsyncState } from '../components/uiParts/AsyncState';
import { RetryBanner } from '../components/uiParts/RetryBanner';
import { SearchBar } from '../components/uiParts/SearchBar';
import { SelectionBar } from '../components/uiParts/SelectionBar';
import { StartReviewButton } from '../components/uiParts/StartReviewButton';
import { CardItem } from '../components/uniqueParts/CardItem';
import { CollectionSelector } from '../components/uniqueParts/CollectionSelector';
import { CollectionSelectorModal } from '../components/uniqueParts/CollectionSelectorModal';
import { DeleteConfirmModal } from '../components/uniqueParts/DeleteConfirmModal';
import { TagFilter } from '../components/uniqueParts/TagFilter';
import { TagFilterModal } from '../components/uniqueParts/TagFilterModal';
import { TodayFilter } from '../components/uniqueParts/TodayFilter';
import { useSelection } from '../hooks/useSelection';

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
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [tagLabels, setTagLabels] = useState<string[]>([]);
  const [collectionLabels, setCollectionLabels] = useState<string[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);

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

  const filterParam: CardFilterKey | undefined = useMemo(() => {
    if (todayOnly) return 'today';
    if (extraFilter !== 'none') return extraFilter;
    return undefined;
  }, [todayOnly, extraFilter]);

  const listFilter: CardListFilter = useMemo(
    () => ({
      sort,
      filter: filterParam,
      q: q.trim().length > 0 ? q.trim() : undefined,
      tagIds,
      collectionIds,
    }),
    [sort, filterParam, q, tagIds, collectionIds],
  );

  const queryKey = useMemo(() => {
    return JSON.stringify(listFilter);
  }, [listFilter]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setInitialLoading(true);
      setInitialError(null);
      setMoreError(null);
      setReviewSession(null);

      try {
        const data = await fetchCards(listFilter);
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

        void fetchCards(listFilter, nextCursor)
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
  }, [nextCursor, initialLoading, moreLoading, queryKey, listFilter]);

  async function retryInitial() {
    setInitialLoading(true);
    setInitialError(null);

    try {
      const data = await fetchCards(listFilter);
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
      const data = (await startReviewRequest(listFilter)) as ReviewStartResponse;
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
    setTagIds([]);
    setCollectionIds([]);
    setTagLabels([]);
    setCollectionLabels([]);
  }

  useEffect(() => {
    if (tagIds.length === 0) {
      setTagLabels([]);
      return;
    }

    void fetchTagOptions().then((options) => {
      setTagLabels(options.filter((option) => tagIds.includes(option.id)).map((option) => option.label));
    });
  }, [tagIds]);

  useEffect(() => {
    if (collectionIds.length === 0) {
      setCollectionLabels([]);
      return;
    }

    void fetchCollectionOptions().then((options) => {
      setCollectionLabels(options.filter((option) => collectionIds.includes(option.id)).map((option) => option.label));
    });
  }, [collectionIds]);

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }

  function toggleCollection(id: string) {
    setCollectionIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }

  return (
    <main className="min-h-screen bg-surface-base px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Card List</p>
          <h1 className="text-4xl font-semibold text-text-primary">カード一覧</h1>
          <p className="max-w-3xl text-sm leading-6 text-text-secondary">
            今日の復習、検索、タグ、コレクション、バルク操作を 1 画面で完結させます。
          </p>
        </header>

        <section aria-label="filters" className="grid gap-4 rounded-[28px] border border-border-subtle bg-surface-panel p-5 md:grid-cols-2 xl:grid-cols-[auto,auto,1fr,auto]">
        <TodayFilter value={todayOnly} onChange={setTodayOnly} />

        <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
          追加フィルタ
          <select
            className="rounded-md border border-border-subtle bg-surface-panel px-3 py-2 text-sm text-text-primary outline-none"
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
        <TagFilter labels={tagLabels} onOpen={() => setTagModalOpen(true)} />
        <CollectionSelector labels={collectionLabels} onOpen={() => setCollectionModalOpen(true)} />

        <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
          ソート
          <select
            className="rounded-md border border-border-subtle bg-surface-panel px-3 py-2 text-sm text-text-primary outline-none"
            value={sort}
            onChange={(e) => setSort(resolveSort(e.currentTarget.value))}
          >
            <option value="next_review_at">次回復習日時</option>
            <option value="proficiency">習熟度</option>
            <option value="created_at">作成日</option>
          </select>
        </label>
      </section>

        <section aria-label="actions" className="flex flex-wrap items-center justify-between gap-4">
          <StartReviewButton disabled={cards.length === 0 || initialLoading} onClick={startReview} />
          <button type="button" onClick={resetFilters} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
            条件をリセット
          </button>
        </section>

        <SelectionBar
          selectedCount={selection.selectedIds.size}
          onArchive={bulkArchive}
          onDelete={() => setDeleteModalOpen(true)}
        />

        {initialError ? <RetryBanner message={`Error: ${initialError}`} onRetry={retryInitial} /> : null}
        {moreError ? <RetryBanner message={`Error: ${moreError}`} /> : null}

      {reviewSession ? (
        <section aria-label="review-session" className="rounded-3xl border border-border-subtle bg-surface-panel p-5">
          <p>
            sessionId: <span data-testid="session-id">{reviewSession.sessionId}</span>
          </p>
          <p>
            cards: <span data-testid="session-count">{reviewSession.cardIds.length}</span>
          </p>
        </section>
      ) : null}

        <section aria-label="card-list" className="space-y-4">
          {initialLoading ? (
            <AsyncState kind="loading" title="カードを読み込み中" description="条件に合うカードを取得しています。" />
          ) : null}

          {!initialLoading && !initialError && cards.length === 0 ? (
            <AsyncState
              kind="empty"
              title="条件に一致するカードがありません。"
              description="フィルタを広げるか、条件をリセットしてください。"
              action={{ label: '条件をリセット', onClick: resetFilters }}
            />
          ) : null}

          {!initialLoading && !initialError
            ? cards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  selected={selection.isSelected(card.id)}
                  onToggleSelected={() => selection.toggle(card.id)}
                />
              ))
            : null}

          {moreLoading ? <p className="text-sm text-text-secondary">Loading more...</p> : null}

          <div ref={sentinelRef} aria-hidden="true" />
        </section>

        <TagFilterModal open={tagModalOpen} selectedIds={tagIds} onToggle={toggleTag} onClose={() => setTagModalOpen(false)} />
        <CollectionSelectorModal
          open={collectionModalOpen}
          selectedIds={collectionIds}
          onToggle={toggleCollection}
          onClose={() => setCollectionModalOpen(false)}
        />

        <DeleteConfirmModal
          open={deleteModalOpen}
          items={selection.selectedItems.map((c) => ({ id: c.id, title: c.title }))}
          onConfirm={confirmBulkDelete}
          onCancel={() => setDeleteModalOpen(false)}
        />

        {bulkWorking ? <p className="text-sm text-text-secondary">Working...</p> : null}
      </div>
    </main>
  );
}
