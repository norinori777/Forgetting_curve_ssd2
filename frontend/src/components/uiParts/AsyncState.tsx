type Props = {
  kind: 'loading' | 'empty';
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

export function AsyncState({ kind, title, description, action }: Props) {
  return (
    <div className="rounded-3xl border border-dashed border-border-subtle bg-surface-panel px-6 py-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-text-muted">{kind}</p>
      <h2 className="mt-2 text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}