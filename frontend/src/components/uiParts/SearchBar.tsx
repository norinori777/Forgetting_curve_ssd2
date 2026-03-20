import { useEffect, useState } from 'react';
import type { ReactNode, Ref } from 'react';

type Props = {
  value: string;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
  label?: string;
  placeholder?: string;
  inputId?: string;
  inputRef?: Ref<HTMLInputElement>;
  statusLabel?: string;
  statusValue?: string;
  statusOptions?: Array<{ value: string; label: string }>;
  onStatusChange?: (value: string) => void;
  actions?: ReactNode;
};

export function SearchBar({
  value,
  onDebouncedChange,
  debounceMs = 300,
  label = '検索',
  placeholder = 'キーワードで検索',
  inputId,
  inputRef,
  statusLabel,
  statusValue,
  statusOptions,
  onStatusChange,
  actions,
}: Props) {
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
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),auto] md:items-end">
      <label className="flex flex-col gap-2 text-sm font-medium text-text-secondary">
        {label}
        <input
          id={inputId}
          ref={inputRef}
          className="rounded-2xl border border-border-subtle bg-surface-panel px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          type="search"
          value={localValue}
          onChange={(e) => setLocalValue(e.currentTarget.value)}
          placeholder={placeholder}
        />
      </label>

      <div className="flex flex-wrap items-end gap-3">
        {statusOptions && statusValue !== undefined && onStatusChange ? (
          <label className="flex min-w-[220px] flex-col gap-2 text-sm font-medium text-text-secondary">
            {statusLabel ?? 'ステータス'}
            <select
              aria-label={statusLabel ?? 'ステータス'}
              className="rounded-2xl border border-border-subtle bg-surface-panel px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              value={statusValue}
              onChange={(event) => onStatusChange(event.currentTarget.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {actions}
      </div>
    </div>
  );
}