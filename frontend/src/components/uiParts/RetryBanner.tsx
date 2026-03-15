type Props = {
  message: string;
  onRetry?: () => void | Promise<void>;
};

export function RetryBanner({ message, onRetry }: Props) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" onClick={() => void onRetry()} className="rounded-full border border-status-danger px-3 py-1">
          再試行
        </button>
      ) : null}
    </div>
  );
}