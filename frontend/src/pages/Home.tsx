export function Home() {
  return (
    <section className="rounded-[28px] border border-border-subtle bg-surface-panel p-6 md:p-8" aria-labelledby="home-page-title">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-primary">Home</p>
      <h1 id="home-page-title" className="mt-2 text-4xl font-semibold text-text-primary">
        ホーム
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-text-secondary">
        学習の起点となるダミーページです。カード一覧は「カード一覧」から、他のトップレベルページは共通レイアウト上で順次差し替えます。
      </p>
    </section>
  );
}