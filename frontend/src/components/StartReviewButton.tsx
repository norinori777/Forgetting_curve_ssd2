type Props = {
  disabled?: boolean;
  onClick: () => void | Promise<void>;
};

export function StartReviewButton({ disabled, onClick }: Props) {
  return (
    <button type="button" disabled={disabled} onClick={() => void onClick()}>
      復習開始
    </button>
  );
}
