"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Full-screen loading overlay shown the moment HR clicks a nav link, until the new
 * page mounts. Next's per-route loading.tsx covers the data-fetch gap, but on a slow
 * connection the click-to-skeleton moment can still feel like nothing happened. This
 * gives the immediate, centered "loading" feedback people expect from a web app.
 *
 * Implementation: this component is keyed by pathname in the layout, so navigating to a
 * new route REMOUNTS it fresh (loading=false). A global click listener flips it on when
 * an in-app link is clicked. No render-phase state juggling.
 */
export function NavLoading() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Path changed → the destination page has mounted → hide the overlay.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (
        !href ||
        !href.startsWith("/") ||
        a.target === "_blank" ||
        e.metaKey || e.ctrlKey || e.shiftKey ||
        href === pathname
      ) {
        return;
      }
      setLoading(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-bg/70 backdrop-blur-sm" aria-live="polite" aria-busy>
      <div className="flex flex-col items-center gap-4">
        {/* H+ brand mark with a spinning ring around it */}
        <div className="relative grid h-16 w-16 place-items-center">
          <span className="absolute inset-0 animate-spin rounded-xl border-[3px] border-transparent border-t-primary border-r-primary" aria-hidden />
          <span className="grid h-12 w-12 animate-pulse place-items-center rounded-lg bg-primary text-lg font-black text-[oklch(0.16_0.01_100)]" aria-hidden>
            H+
          </span>
        </div>
        <span className="text-sm font-semibold text-ink">กำลังโหลด…</span>
      </div>
    </div>
  );
}
