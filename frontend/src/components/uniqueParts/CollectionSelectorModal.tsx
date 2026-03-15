import { useEffect, useState } from 'react';

import type { FilterOption } from '../../domain/cardList';
import { fetchCollectionOptions } from '../../services/api/filterOptionsApi';
import { ModalShell } from '../uiParts/ModalShell';
import { OptionList } from '../uiParts/OptionList';
import { SearchBar } from '../uiParts/SearchBar';

type Props = {
  open: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
};

export function CollectionSelectorModal({ open, selectedIds, onToggle, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<FilterOption[]>([]);

  useEffect(() => {
    if (!open) return;
    void fetchCollectionOptions(query).then(setOptions).catch(() => setOptions([]));
  }, [open, query]);

  return (
    <ModalShell
      open={open}
      title="コレクションで絞り込む"
      ariaLabel="collection-filter-modal"
      onClose={onClose}
      footer={<button type="button" onClick={onClose} className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white">適用</button>}
    >
      <div className="space-y-4">
        <SearchBar value={query} onDebouncedChange={setQuery} debounceMs={200} />
        <OptionList ariaLabel="collection-options" options={options} selectedIds={selectedIds} onToggle={onToggle} />
      </div>
    </ModalShell>
  );
}