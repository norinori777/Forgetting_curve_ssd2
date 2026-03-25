import { Link } from 'react-router-dom';

type Action = {
  label: string;
  to?: string;
  onClick?: () => void | Promise<void>;
  emphasis?: 'primary' | 'secondary';
};

type Props = {
  title: string;
  description: string;
  kind: 'first-use' | 'no-review' | 'error';
  actions: Action[];
};

function actionClassName(emphasis: Action['emphasis']): string {
  if (emphasis === 'primary') {
    return 'rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white';
  }

  return 'rounded-full border border-border-subtle px-4 py-2 text-sm text-text-primary';
}

export function HomeStatePanel({ title, description, kind, actions }: Props) {
  return (
    <section className="rounded-[28px] border border-dashed border-border-subtle bg-surface-panel px-6 py-6" aria-live={kind === 'error' ? 'assertive' : 'polite'}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">{kind}</p>
      <h2 className="mt-2 text-2xl font-semibold text-text-primary">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-text-secondary">{description}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {actions.map((action) => {
          if (action.to) {
            return (
              <Link key={`${kind}-${action.label}`} to={action.to} className={actionClassName(action.emphasis)}>
                {action.label}
              </Link>
            );
          }

          return (
            <button key={`${kind}-${action.label}`} type="button" onClick={() => void action.onClick?.()} className={actionClassName(action.emphasis)}>
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}