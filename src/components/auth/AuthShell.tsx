/** Two-panel shell for login/onboarding: brand panel + form panel. */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="relative overflow-hidden bg-ink px-8 py-10 text-paper md:flex md:w-[44%] md:flex-col md:justify-between md:p-14">
        <svg aria-hidden="true" viewBox="0 0 150 150" className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 text-saffron opacity-20">
          <circle cx="75" cy="75" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="75" cy="75" r="42" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="75" y1="75" x2="75" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="75" y1="75" x2="106" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="relative font-display text-2xl font-semibold">
          Waqt<span className="text-saffron">.</span>
        </p>
        <p className="relative mt-6 max-w-sm font-display text-3xl leading-tight md:text-4xl">
          Your booking page, ready in five minutes.
        </p>
      </aside>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold">{title}</h1>
            <p className="text-sm text-ink-muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
