"use client";

import { useState } from "react";

type Theme = "light" | "dark";

/** Read the current theme from the DOM (set pre-paint by the inline script in layout). */
function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const stored = document.documentElement.getAttribute("data-theme") as Theme | null;
  return stored ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

/** Toggles [data-theme] on <html> and remembers the choice in localStorage. */
export function ThemeToggle() {
  // Lazy initializer reads the DOM once on mount — no setState-in-effect cascade.
  const [theme, setTheme] = useState<Theme>(currentTheme);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore storage errors (private mode) */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-card)] border border-border text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
