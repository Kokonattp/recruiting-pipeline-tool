export function PageSkeleton() {
  return (
    <div className="grid min-h-[55vh] place-items-center px-4 py-16" aria-live="polite" aria-busy>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative grid h-20 w-20 place-items-center">
          <span
            className="absolute inset-0 animate-spin rounded-2xl border-[3px] border-transparent border-r-primary border-t-primary motion-reduce:animate-none"
            aria-hidden
          />
          <span
            className="grid h-14 w-14 place-items-center rounded-xl bg-primary text-xl font-black text-primary-ink shadow-[3px_3px_0_0_var(--loga-edge)]"
            aria-hidden
          >
            H+
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink">กำลังโหลด...</p>
          <p className="text-xs font-medium text-ink-3">Recruiting Pipeline</p>
        </div>
      </div>
    </div>
  );
}
