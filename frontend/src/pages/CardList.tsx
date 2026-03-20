import { useEffect, useMemo, useRef, useState } from 'react';

import type { ApiCard, CardFilterKey, CardListFilter } from '../domain/cardList';
import { bulkAction } from '../services/api/bulkApi';
import { fetchCards } from '../services/api/cardListApi';
import { startReview as startReviewRequest } from '../services/api/reviewApi';
import { AsyncState } from '../components/uiParts/AsyncState';
import { RetryBanner } from '../components/uiParts/RetryBanner';
import { SearchBar } from '../components/uiParts/SearchBar';
import { SelectionBar } from '../components/uiParts/SelectionBar';
import { StartReviewButton } from '../components/uiParts/StartReviewButton';
import { CardItem } from '../components/uniqueParts/CardItem';
import { DeleteConfirmModal } from '../components/uniqueParts/DeleteConfirmModal';
import {
  FilterSelectionModal,
  type FilterSelectionValue,
  type FilterTarget,
} from '../components/uniqueParts/FilterSelectionModal';
import { FilterSelector } from '../components/uniqueParts/FilterSelector';
import { useSelection } from '../hooks/useSelection';

type ReviewStartResponse = {
  sessionId: string;
  cardIds: string[];
};

type StatusFilter = 'all' | CardFilterKey;
type SortKey = 'next_review_at' | 'proficiency' | 'created_at';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'today', label: '今日の復習' },
  { value: 'overdue', label: '期限切れ' },
  { value: 'unlearned', label: '未学習' },
];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'next_review_at', label: '次回復習日時' },
  { value: 'proficiency', label: '習熟度' },
  { value: 'created_at', label: '作成日' },
];

const emptyFilterSelection: FilterSelectionValue = {
  tagIds: [],
  tagLabels: [],
  collectionIds: [],
  collectionLabels: [],
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim().length > 0) return err;
  return fallback;
}

function resolveStatusFilter(value: string): StatusFilter {
  if (value === 'today' || value === 'overdue' || value === 'unlearned') return value;
  return 'all';
}

function resolveSort(value: string): SortKey {
  if (value === 'next_review_at' || value === 'proficiency' || value === 'created_at') return value;
  return 'next_review_at';
}

export function CardList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('next_review_at');
  const [q, setQ] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [tagLabels, setTagLabels] = useState<string[]>([]);
  const [collectionLabels, setCollectionLabels] = useState<string[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterTarget, setFilterTarget] = useState<FilterTarget>('tag');
  const [bulkTagMode, setBulkTagMode] = useState<'addTags' | 'removeTags' | null>(null);
  const [bulkTagSelection, setBulkTagSelection] = useState<FilterSelectionValue>(emptyFilterSelection);

  const [cards, setCards] = useState<ApiCard[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const [initialLoading, setInitialLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);

  const [initialError, setInitialError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);

  const [reviewSession, setReviewSession] = useState<ReviewStartResponse | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);

  const selection = useSelection(cards);

  const filterParam: CardFilterKey | undefined = statusFilter === 'all' ? undefined : statusFilter;

  const listFilter: CardListFilter = useMemo(
    () => ({
      sort,
      filter: filterParam,
      q: q.trim().length > 0 ? q.trim() : undefined,
      tagIds,
      collectionIds,
    }),
    [collectionIds, filterParam, q, sort, tagIds],
  );

  const queryKey = useMemo(() => {
    return JSON.stringify(listFilter);
  }, [listFilter]);

  useEffect(() => {
    selection.clear();
  }, [queryKey]);

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

  async function loadMore() {
    if (!nextCursor || initialLoading || moreLoading) return;

    setMoreLoading(true);
    setMoreError(null);

    try {
      const data = await fetchCards(listFilter, nextCursor);
      setCards((prev) => [...prev, ...(data.items ?? [])]);
      setNextCursor(data.nextCursor);
    } catch (e: unknown) {
      setMoreError(getErrorMessage(e, 'failed to load more'));
    } finally {
      setMoreLoading(false);
    }
  }

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

        void loadMore();
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

  async function applyBulkTagAction(action: 'addTags' | 'removeTags', selectedTagIds: string[]) {
    if (selection.selectedIds.size === 0 || selectedTagIds.length === 0) return;

    setBulkWorking(true);
    setMoreError(null);

    try {
      await bulkAction(action, Array.from(selection.selectedIds), selectedTagIds);
      setBulkTagMode(null);
      setBulkTagSelection(emptyFilterSelection);
      await retryInitial();
    } catch (e: unknown) {
      setMoreError(getErrorMessage(e, 'failed to update tags'));
    } finally {
      setBulkWorking(false);
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
    setStatusFilter('all');
    setSort('next_review_at');
    setQ('');
    setTagIds([]);
    setCollectionIds([]);
    setTagLabels([]);
    setCollectionLabels([]);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = !!target?.closest('input, textarea, select, [contenteditable="true"]');

      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (isTypingTarget || filterModalOpen || bulkTagMode || deleteModalOpen) {
        return;
      }

      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        selection.toggleAll();
        return;
      }

      if (event.key.toLowerCase() === 'r' && cards.length > 0 && !initialLoading) {
        event.preventDefault();
        void startReview();
        return;
      }

      if (event.key === 'Delete' && selection.selectedIds.size > 0) {
        event.preventDefault();
        setDeleteModalOpen(true);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bulkTagMode, cards.length, deleteModalOpen, filterModalOpen, initialLoading, selection, selection.selectedIds.size]);

  function applyFilterSelection(selectionValue: FilterSelectionValue) {
    setTagIds(selectionValue.tagIds);
    setTagLabels(selectionValue.tagLabels);
    setCollectionIds(selectionValue.collectionIds);
    setCollectionLabels(selectionValue.collectionLabels);
    setFilterModalOpen(false);
  }

  return (
    <section className="space-y-6 py-8" aria-label="cards-page">
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Card List</p>
          <h1 className="text-4xl font-semibold text-text-primary">カード一覧</h1>
          <p className="max-w-3xl text-sm leading-6 text-text-secondary">
            今日の復習、検索、タグ、コレクション、バルク操作を 1 画面で完結させます。
          </p>
        </header>

        <section aria-label="filters" className="space-y-4 rounded-[28px] border border-border-subtle bg-surface-panel p-5">
          <SearchBar
            value={q}
            onDebouncedChange={setQ}
            inputId="card-search"
            inputRef={searchInputRef}
            statusLabel="ステータス"
            statusValue={statusFilter}
            statusOptions={STATUS_OPTIONS}
            onStatusChange={(value) => setStatusFilter(resolveStatusFilter(value))}
          />

          <FilterSelector
            tagLabels={tagLabels}
            collectionLabels={collectionLabels}
            onOpen={() => {
              setFilterTarget('tag');
              setFilterModalOpen(true);
            }}
          />
        </section>

        <section aria-label="actions" className="flex flex-wrap items-center justify-between gap-4">
          <StartReviewButton disabled={cards.length === 0 || initialLoading} onClick={startReview} />
          <button type="button" onClick={resetFilters} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
            条件をリセット
          </button>
        </section>

        <SelectionBar
          selectedCount={selection.selectedIds.size}
          allSelected={selection.allSelected}
          onToggleAll={selection.toggleAll}
          onAddTags={() => setBulkTagMode('addTags')}
          onRemoveTags={() => setBulkTagMode('removeTags')}
          onArchive={bulkArchive}
          onDelete={() => setDeleteModalOpen(true)}
          disabled={bulkWorking}
        />

        {initialError ? <RetryBanner message={`Error: ${initialError}`} onRetry={retryInitial} /> : null}
        {moreError ? <RetryBanner message={`Error: ${moreError}`} onRetry={loadMore} /> : null}

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
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-border-subtle bg-surface-panel px-5 py-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">一覧</p>
              <p className="mt-1 text-sm text-text-secondary">表示中 {cards.length} 件</p>
            </div>
            <label className="flex items-center gap-3 text-sm font-medium text-text-secondary">
              <span>ソート</span>
              <select
                aria-label="ソート"
                className="rounded-2xl border border-border-subtle bg-surface-base px-4 py-2 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                value={sort}
                onChange={(event) => setSort(resolveSort(event.currentTarget.value))}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

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
                  onStartReview={() => void startReview()}
                />
              ))
            : null}

          {moreLoading ? <p className="text-sm text-text-secondary">Loading more...</p> : null}

          <div ref={sentinelRef} aria-hidden="true" />
        </section>

        <FilterSelectionModal
          open={filterModalOpen}
          title="絞り込み対象を選択"
          activeTarget={filterTarget}
          initialSelection={{ tagIds, tagLabels, collectionIds, collectionLabels }}
          onActiveTargetChange={setFilterTarget}
          onApply={applyFilterSelection}
          onClose={() => setFilterModalOpen(false)}
        />

        <FilterSelectionModal
          open={bulkTagMode !== null}
          title={bulkTagMode === 'addTags' ? '一括で付与するタグを選択' : '一括で削除するタグを選択'}
          activeTarget="tag"
          allowCollections={false}
          initialSelection={bulkTagSelection}
          onActiveTargetChange={setFilterTarget}
          onApply={(selectionValue) => {
            setBulkTagSelection(selectionValue);
            void applyBulkTagAction(bulkTagMode ?? 'addTags', selectionValue.tagIds);
          }}
          onClose={() => setBulkTagMode(null)}
        />

        <DeleteConfirmModal
          open={deleteModalOpen}
          items={selection.selectedItems.map((c) => ({ id: c.id, title: c.title }))}
          onConfirm={confirmBulkDelete}
          onCancel={() => setDeleteModalOpen(false)}
        />

        {bulkWorking ? <p className="text-sm text-text-secondary">Working...</p> : null}
      </div>
    </section>
  );
}
