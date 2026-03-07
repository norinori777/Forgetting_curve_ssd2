type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function TagFilter({ value, onChange }: Props) {
  return (
    <label>
      タグ
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder="例: 英語, 数学"
      />
    </label>
  );
}
