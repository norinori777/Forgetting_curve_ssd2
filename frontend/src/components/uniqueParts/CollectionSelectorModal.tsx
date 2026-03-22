import { useEffect, useState } from 'react';

import type { FilterOption } from '../../domain/cardList';
import { fetchCollectionOptions } from '../../services/api/filterOptionsApi';
import { ModalShell } from '../uiParts/ModalShell';
import { OptionList } from '../uiParts/OptionList';
import { SearchBar } from '../uiParts/SearchBar';

type Props = {
  open: boolean;
  selectedIds: string[];
  onToggle: (id: string, label: string) => void;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  applyLabel?: string;
  selectionMode?: 'multiple' | 'single';
};

export function CollectionSelectorModal({
  open,
  selectedIds,
  onToggle,
  onClose,
  title = 'コレクションを選択',
  ariaLabel = 'collection-filter-modal',
  applyLabel = '適用',
  selectionMode = 'single',
}: Props) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<FilterOption[]>([]);

  useEffect(() => {
    if (!open) return;
    void fetchCollectionOptions(query).then(setOptions).catch(() => setOptions([]));
  }, [open, query]);

  return (
    <ModalShell
      open={open}
      title={title}
      ariaLabel={ariaLabel}
      onClose={onClose}
      footer={<button type="button" onClick={onClose} className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white">{applyLabel}</button>}
    >
      <div className="space-y-4">
        <SearchBar value={query} onDebouncedChange={setQuery} debounceMs={200} />
        <OptionList
          ariaLabel="collection-options"
          options={options}
          selectedIds={selectedIds}
          selectionMode={selectionMode}
          onToggle={(id) => {
            const option = options.find((entry) => entry.id === id);
            if (!option) return;
            onToggle(id, option.label);
          }}
        />
      </div>
    </ModalShell>
  );
}