type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function TodayFilter({ value, onChange }: Props) {
  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-panel px-4 py-2 text-sm text-text-primary">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.currentTarget.checked)} />
      今日の復習
    </label>
  );
}