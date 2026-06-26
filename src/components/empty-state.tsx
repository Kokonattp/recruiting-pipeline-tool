interface EmptyStateProps {
  title: string;
  description: string;
  hint?: string;
  children?: React.ReactNode;
}

/** Shown when a module has no data yet, or a prerequisite (DB/API key) isn't configured. */
export function EmptyState({ title, description, hint, children }: EmptyStateProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-ink-2">{description}</p>
      {hint ? (
        <p className="mt-3 max-w-md rounded-[var(--radius-card)] bg-surface-2 px-3 py-2 font-mono text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
