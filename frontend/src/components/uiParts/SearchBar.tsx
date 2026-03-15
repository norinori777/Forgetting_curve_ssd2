import { useEffect, useState } from 'react';

type Props = {
  value: string;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
};

export function SearchBar({ value, onDebouncedChange, debounceMs = 300 }: Props) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      onDebouncedChange(localValue);
    }, debounceMs);

    return () => {
      window.clearTimeout(id);
    };
  }, [localValue, debounceMs, onDebouncedChange]);

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
      検索
      <input
        className="rounded-md border border-border-subtle bg-surface-panel px-3 py-2 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.currentTarget.value)}
        placeholder="キーワードで検索"
      />
    </label>
  );
}