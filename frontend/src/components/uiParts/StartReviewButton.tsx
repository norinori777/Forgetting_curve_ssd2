type Props = {
  disabled?: boolean;
  onClick: () => void | Promise<void>;
};

export function StartReviewButton({ disabled, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onClick()}
      className="rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted"
    >
      復習開始
    </button>
  );
}