interface PageHeaderProps {
  module: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

/** Consistent page header used by every module screen. */
export function PageHeader({ module, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-3">{module}</span>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink text-balance">{title}</h1>
        <p className="mt-1 max-w-prose text-sm text-ink-2">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
