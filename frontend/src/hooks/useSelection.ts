import { useMemo, useState } from 'react';

type Identifiable = { id: string };

export function useSelection<TItem extends Identifiable>(items: TItem[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const selectedItems = useMemo(() => {
    return items.filter((i) => selectedIds.has(i.id));
  }, [items, selectedIds]);

  function isSelected(id: string): boolean {
    return selectedIds.has(id);
  }

  function toggle(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clear(): void {
    setSelectedIds(new Set());
  }

  return {
    selectedIds,
    selectedItems,
    isSelected,
    toggle,
    clear,
  };
}
