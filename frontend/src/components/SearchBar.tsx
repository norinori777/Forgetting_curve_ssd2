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
    <label>
      検索
      <input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.currentTarget.value)}
        placeholder="キーワード"
      />
    </label>
  );
}
