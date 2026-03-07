type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export function TodayFilter({ value, onChange }: Props) {
  return (
    <label>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      今日の復習
    </label>
  );
}
