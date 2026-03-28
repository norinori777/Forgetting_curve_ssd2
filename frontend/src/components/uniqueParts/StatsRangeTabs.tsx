import type { StatisticsRange } from '../../domain/stats';

type Props = {
  selectedRange: StatisticsRange;
  onSelect: (range: StatisticsRange) => void;
  disabled?: boolean;
};

const ranges: Array<{ value: StatisticsRange; label: string }> = [
  { value: 'today', label: '今日' },
  { value: '7d', label: '7日間' },
  { value: '30d', label: '30日間' },
  { value: 'all', label: '全期間' },
];

export function StatsRangeTabs({ selectedRange, onSelect, disabled = false }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="統計の期間切り替え">
      {ranges.map((range) => {
        const isSelected = range.value === selectedRange;
        return (
          <button
            key={range.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onSelect(range.value)}
            className={[
              'rounded-full px-4 py-2 text-sm font-medium transition',
              isSelected ? 'bg-brand-primary text-white' : 'border border-border-subtle bg-surface-base text-text-primary',
              disabled ? 'opacity-60' : '',
            ].join(' ')}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}