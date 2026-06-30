/**
 * Shared loading skeleton shown while a module's server data is fetching. Next renders
 * this instantly on navigation (via each route's loading.tsx), so switching modules
 * feels immediate instead of freezing on the previous page. Mirrors the page header +
 * a few content blocks so the layout doesn't jump when real content arrives.
 */
export function PageSkeleton() {
  return (
    <div className="relative">
      {/* faint skeleton so the layout doesn't jump */}
      <div className="animate-pulse space-y-6 opacity-60" aria-hidden>
        <div className="flex items-start gap-3.5 border-b border-border pb-5">
          <div className="h-11 w-11 rounded-xl bg-surface-2" />
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-surface-2" />
            <div className="h-6 w-56 rounded bg-surface-2" />
            <div className="h-3 w-72 rounded bg-surface-2" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 rounded-[var(--radius-card)] bg-surface-2" />
          <div className="h-40 rounded-[var(--radius-card)] bg-surface-2" />
        </div>
      </div>

      {/* clear spinner + label so HR knows it's loading, centered over the content */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 pt-24">
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-border-strong border-t-primary" aria-hidden />
        <span className="text-sm font-medium text-ink-2">กำลังโหลด…</span>
      </div>
    </div>
  );
}
