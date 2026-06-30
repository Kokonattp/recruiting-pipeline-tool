/**
 * Shared loading skeleton shown while a module's server data is fetching. Next renders
 * this instantly on navigation (via each route's loading.tsx), so switching modules
 * feels immediate instead of freezing on the previous page. Mirrors the page header +
 * a few content blocks so the layout doesn't jump when real content arrives.
 */
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      {/* header */}
      <div className="flex items-start gap-3.5 border-b border-border pb-5">
        <div className="h-11 w-11 rounded-xl bg-surface-2" />
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-surface-2" />
          <div className="h-6 w-56 rounded bg-surface-2" />
          <div className="h-3 w-72 rounded bg-surface-2" />
        </div>
      </div>
      {/* content blocks */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 rounded-[var(--radius-card)] bg-surface-2" />
        <div className="h-40 rounded-[var(--radius-card)] bg-surface-2" />
      </div>
      <div className="h-10 w-40 rounded-[var(--radius-card)] bg-surface-2" />
    </div>
  );
}
