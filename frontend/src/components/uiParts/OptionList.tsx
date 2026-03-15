import type { FilterOption } from '../../domain/cardList';

type Props = {
  ariaLabel: string;
  options: FilterOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export function OptionList({ ariaLabel, options, selectedIds, onToggle }: Props) {
  if (options.length === 0) {
    return <p className="text-sm text-text-muted">候補がありません。</p>;
  }

  return (
    <ul aria-label={ariaLabel} className="space-y-2">
      {options.map((option) => {
        const checked = selectedIds.includes(option.id);

        return (
          <li key={option.id}>
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border-subtle px-4 py-3 text-sm text-text-primary">
              <span>{option.label}</span>
              <input type="checkbox" checked={checked} onChange={() => onToggle(option.id)} />
            </label>
          </li>
        );
      })}
    </ul>
  );
}