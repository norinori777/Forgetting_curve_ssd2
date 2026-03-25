import { Link } from 'react-router-dom';

type Props = {
  busy?: boolean;
  canStartReview: boolean;
  onStartReview: () => void | Promise<void>;
};

type ActionLink = {
  title: string;
  description: string;
  to?: string;
};

const secondaryActions: ActionLink[] = [
  { title: 'カード一覧', description: '一覧から復習対象や学習カードを確認します。', to: '/cards' },
  { title: '学習カード登録', description: '最初の 1 枚や新しい学習内容を追加します。', to: '/cards/create' },
  { title: '設定', description: '学習環境や表示設定を見直します。', to: '/settings' },
];

export function HomePrimaryActions({ busy = false, canStartReview, onStartReview }: Props) {
  return (
    <section aria-labelledby="home-primary-actions-title" className="space-y-4 rounded-[28px] border border-border-subtle bg-surface-panel p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Primary Actions</p>
        <h2 id="home-primary-actions-title" className="mt-2 text-2xl font-semibold text-text-primary">
          次に進む操作
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr),repeat(3,minmax(0,1fr))]">
        <button
          type="button"
          onClick={() => void onStartReview()}
          disabled={!canStartReview || busy}
          className="flex min-h-[180px] flex-col justify-between rounded-[28px] bg-brand-primary p-5 text-left text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Today Review</p>
            <h3 className="mt-2 text-2xl font-semibold">復習を始める</h3>
            <p className="mt-3 text-sm leading-6 text-white/90">今日の復習対象だけを開始して、現在の学習ループへすぐ戻ります。</p>
          </div>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">{busy ? '開始中...' : '今日の復習へ進む'}</span>
        </button>

        {secondaryActions.map((action) => (
          <Link
            key={action.title}
            to={action.to ?? '/'}
            className="flex min-h-[180px] flex-col justify-between rounded-[28px] border border-border-subtle bg-surface-base p-5 text-left transition hover:border-border-strong hover:bg-surface-panel"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Navigate</p>
              <h3 className="mt-2 text-xl font-semibold text-text-primary">{action.title}</h3>
              <p className="mt-3 text-sm leading-6 text-text-secondary">{action.description}</p>
            </div>
            <span className="mt-4 text-sm font-semibold text-brand-primary">開く</span>
          </Link>
        ))}
      </div>
    </section>
  );
}