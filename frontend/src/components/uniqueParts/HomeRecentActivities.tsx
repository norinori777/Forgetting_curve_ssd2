import type { HomeRecentActivity } from '../../domain/home';

type Props = {
  activities: HomeRecentActivity[];
};

function formatOccurredAt(value: string): string {
  return new Date(value).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const activityLabelMap: Record<HomeRecentActivity['type'], string> = {
  review_completed: 'Review Completed',
  review_started: 'Review Started',
  card_created: 'Card Created',
};

export function HomeRecentActivities({ activities }: Props) {
  return (
    <section aria-labelledby="home-recent-activities-title" className="rounded-[28px] border border-border-subtle bg-surface-panel p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Recent Activities</p>
        <h2 id="home-recent-activities-title" className="mt-2 text-2xl font-semibold text-text-primary">
          最近のアクティビティ
        </h2>
      </div>

      {activities.length === 0 ? (
        <div className="mt-5 rounded-3xl bg-surface-base px-5 py-4 text-sm leading-6 text-text-secondary">まだ主要イベントはありません。最初の学習カード登録か復習開始から始めてください。</div>
      ) : (
        <ol className="mt-5 space-y-3" aria-label="recent-activities-list">
          {activities.map((activity) => (
            <li key={activity.id} className="rounded-3xl bg-surface-base px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">{activityLabelMap[activity.type]}</p>
                  <p className="mt-2 text-base font-medium text-text-primary">{activity.label}</p>
                </div>
                <div className="text-right text-sm text-text-secondary">
                  <p>{formatOccurredAt(activity.occurredAt)}</p>
                  {activity.count !== null ? <p className="mt-1 text-xs text-text-muted">件数: {activity.count}</p> : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}