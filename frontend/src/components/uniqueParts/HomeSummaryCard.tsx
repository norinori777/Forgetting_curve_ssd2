type Props = {
  label: string;
  value: number;
  description: string;
  testId: string;
};

export function HomeSummaryCard({ label, value, description, testId }: Props) {
  return (
    <article className="rounded-[28px] border border-border-subtle bg-surface-panel p-5 shadow-sm" aria-label={label}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <p data-testid={testId} className="mt-3 text-4xl font-semibold text-text-primary">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
    </article>
  );
}