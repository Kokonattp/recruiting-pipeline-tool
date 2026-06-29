interface PageHeaderProps {
  module: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  /** optional leading icon to give each module a recognizable identity */
  icon?: React.ReactNode;
}

/** Consistent page header used by every module screen. */
export function PageHeader({ module, title, description, actions, icon }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
      <div className="flex items-start gap-3.5">
        {icon ? (
          <span
            aria-hidden
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
          >
            {icon}
          </span>
        ) : null}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">{module}</span>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-ink text-balance">{title}</h1>
          <p className="mt-1 max-w-prose text-sm text-ink-2">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
