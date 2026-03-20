import { useEffect, useMemo, useState } from 'react';

import type { FilterOption } from '../../domain/cardList';
import { fetchCollectionOptions, fetchTagOptions } from '../../services/api/filterOptionsApi';
import { AsyncState } from '../uiParts/AsyncState';
import { ModalShell } from '../uiParts/ModalShell';
import { OptionList } from '../uiParts/OptionList';
import { RetryBanner } from '../uiParts/RetryBanner';
import { SearchBar } from '../uiParts/SearchBar';

export type FilterTarget = 'tag' | 'collection';

export type FilterSelectionValue = {
  tagIds: string[];
  tagLabels: string[];
  collectionIds: string[];
  collectionLabels: string[];
};

type Props = {
  open: boolean;
  title: string;
  activeTarget: FilterTarget;
  allowCollections?: boolean;
  initialSelection: FilterSelectionValue;
  onActiveTargetChange: (target: FilterTarget) => void;
  onApply: (selection: FilterSelectionValue) => void;
  onClose: () => void;
};

const emptySelection: FilterSelectionValue = {
  tagIds: [],
  tagLabels: [],
  collectionIds: [],
  collectionLabels: [],
};

export function FilterSelectionModal({
  open,
  title,
  activeTarget,
  allowCollections = true,
  initialSelection,
  onActiveTargetChange,
  onApply,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<FilterSelectionValue>(initialSelection);
  const [options, setOptions] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelection(initialSelection);
    setQuery('');
    setError(null);
  }, [open, initialSelection]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadOptions() {
      setLoading(true);
      setError(null);

      try {
        const nextOptions =
          activeTarget === 'tag' ? await fetchTagOptions(query) : await fetchCollectionOptions(query);
        if (!cancelled) {
          setOptions(nextOptions);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '候補の取得に失敗しました';
          setError(message);
          setOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [open, activeTarget, query]);

  const selectedIds = activeTarget === 'tag' ? selection.tagIds : selection.collectionIds;
  const selectedLabels = activeTarget === 'tag' ? selection.tagLabels : selection.collectionLabels;

  const summaryText = useMemo(() => {
    const tagText = selection.tagLabels.length > 0 ? selection.tagLabels.join(', ') : 'なし';
    const collectionText = selection.collectionLabels.length > 0 ? selection.collectionLabels.join(', ') : 'なし';
    return `タグ: ${tagText} / コレクション: ${collectionText}`;
  }, [selection.collectionLabels, selection.tagLabels]);

  function toggleOption(id: string) {
    const option = options.find((item) => item.id === id);
    if (!option) return;

    setSelection((prev) => {
      if (activeTarget === 'tag') {
        const exists = prev.tagIds.includes(id);
        return {
          ...prev,
          tagIds: exists ? prev.tagIds.filter((value) => value !== id) : [...prev.tagIds, id],
          tagLabels: exists ? prev.tagLabels.filter((value) => value !== option.label) : [...prev.tagLabels, option.label],
        };
      }

      const exists = prev.collectionIds.includes(id);
      return {
        ...prev,
        collectionIds: exists ? prev.collectionIds.filter((value) => value !== id) : [...prev.collectionIds, id],
        collectionLabels: exists
          ? prev.collectionLabels.filter((value) => value !== option.label)
          : [...prev.collectionLabels, option.label],
      };
    });
  }

  function clearCurrentTarget() {
    setSelection((prev) =>
      activeTarget === 'tag'
        ? { ...prev, tagIds: emptySelection.tagIds, tagLabels: emptySelection.tagLabels }
        : { ...prev, collectionIds: emptySelection.collectionIds, collectionLabels: emptySelection.collectionLabels },
    );
  }

  return (
    <ModalShell
      open={open}
      title={title}
      ariaLabel="filter-selection-modal"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={clearCurrentTarget} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
            クリア
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary">
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => onApply(selection)}
              className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
            >
              適用
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {allowCollections ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-text-secondary">絞り込み対象を選択</legend>
            <div className="flex gap-4 text-sm text-text-primary">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="filter-target"
                  checked={activeTarget === 'tag'}
                  onChange={() => onActiveTargetChange('tag')}
                />
                タグ
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="filter-target"
                  checked={activeTarget === 'collection'}
                  onChange={() => onActiveTargetChange('collection')}
                />
                コレクション
              </label>
            </div>
          </fieldset>
        ) : null}

        <SearchBar
          value={query}
          onDebouncedChange={setQuery}
          debounceMs={200}
          label="候補検索"
          placeholder={activeTarget === 'tag' ? 'タグ名で絞り込む' : 'コレクション名で絞り込む'}
        />

        {error ? <RetryBanner message={error} onRetry={() => setQuery((prev) => prev)} /> : null}

        {loading ? (
          <AsyncState kind="loading" title="候補を読み込み中" description="選択肢を取得しています。" />
        ) : null}

        {!loading && !error && options.length === 0 ? (
          <AsyncState kind="empty" title="候補が見つかりません" description="検索語を変えて再度お試しください。" />
        ) : null}

        {!loading && !error && options.length > 0 ? (
          <OptionList
            ariaLabel={activeTarget === 'tag' ? 'shared-tag-options' : 'shared-collection-options'}
            options={options}
            selectedIds={selectedIds}
            onToggle={toggleOption}
          />
        ) : null}

        <div className="rounded-3xl bg-surface-base px-4 py-3 text-sm text-text-secondary">
          <p className="font-medium text-text-primary">選択中</p>
          <p className="mt-1">{selectedLabels.length > 0 ? selectedLabels.join(', ') : 'なし'}</p>
          {allowCollections ? <p className="mt-2 text-xs text-text-muted">{summaryText}</p> : null}
        </div>
      </div>
    </ModalShell>
  );
}