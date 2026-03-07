type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function CollectionSelector({ value, onChange }: Props) {
  return (
    <label>
      コレクション
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder="collection id"
      />
    </label>
  );
}
