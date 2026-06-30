"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { signOut } from "@/app/login/actions";

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar with hamburger (hidden on lg+) */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-[oklch(0.16_0.01_100)] px-4 py-3 text-white lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--primary)] text-sm font-black text-[oklch(0.16_0.01_100)]">H+</span>
          <span className="text-sm font-bold">Recruiting Pipeline</span>
        </Link>
        <button
          type="button"
          aria-label="เปิดเมนู"
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-white/80 hover:bg-white/10"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Backdrop (mobile, when open) */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}

      {/* Sidebar: static on lg+, slide-in drawer on mobile */}
      <aside
        className={[
          "z-50 flex w-64 shrink-0 flex-col bg-[oklch(0.16_0.01_100)] text-white",
          "fixed inset-y-0 left-0 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5 leading-tight">
          {/* H+ mark — yellow tile, black wordmark, like the Hotel Plus logo */}
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary)] text-[oklch(0.16_0.01_100)] text-base font-black tracking-tight"
          >
            H+
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white">Recruiting Pipeline</span>
            <span className="text-xs text-white/55">HR Hiring Tool</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "group relative rounded-[var(--radius-card)] px-3 py-2.5 transition-colors",
                active
                  ? "bg-[var(--primary)] text-[oklch(0.16_0.01_100)]"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "block text-[11px] font-medium uppercase tracking-wide",
                  active ? "text-[oklch(0.16_0.01_100)]/70" : "text-white/45",
                ].join(" ")}
              >
                {item.module}
              </span>
              <span className="block text-sm font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 px-3 py-3">
        {userEmail ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-card)] px-2 py-1.5">
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-[oklch(0.16_0.01_100)]"
            >
              {userEmail[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-white/70" title={userEmail}>
              {userEmail}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="ออกจากระบบ"
                className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-[var(--danger)]"
                title="ออกจากระบบ"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <p className="px-2 text-xs text-white/45">Senior AI Workflow &amp; Automation Engineer</p>
        )}
      </div>
      </aside>
    </>
  );
}
