import { useEffect, useMemo, useState } from 'react';

type Identifiable = { id: string };

export function useSelection<TItem extends Identifiable>(items: TItem[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const itemIds = new Set(items.map((item) => item.id));
    setSelectedIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => itemIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const selectedItems = useMemo(() => {
    return items.filter((i) => selectedIds.has(i.id));
  }, [items, selectedIds]);

  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

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

  function toggleAll(): void {
    setSelectedIds((prev) => {
      if (items.length > 0 && items.every((item) => prev.has(item.id))) {
        return new Set();
      }

      return new Set(items.map((item) => item.id));
    });
  }

  return {
    selectedIds,
    selectedItems,
    allSelected,
    isSelected,
    toggle,
    toggleAll,
    clear,
  };
}
