"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-ink">Recruiting Pipeline</span>
          <span className="text-xs text-ink-3">HR Hiring Tool</span>
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
                "group rounded-[var(--radius-card)] px-3 py-2.5 transition-colors",
                active
                  ? "bg-primary-soft text-ink"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              ].join(" ")}
            >
              <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-3">
                {item.module}
              </span>
              <span className="block text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-xs text-ink-3">
        <p>Senior AI Workflow &amp; Automation Engineer</p>
      </div>
    </aside>
  );
}
