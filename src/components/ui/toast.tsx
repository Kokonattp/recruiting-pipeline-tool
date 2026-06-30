"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onDone: () => void;
  duration?: number;
}

/** Minimal auto-dismiss toast. Mount when message is set; calls onDone after duration. */
export function Toast({ message, onDone, duration = 2500 }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300); // wait for fade out
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed bottom-5 left-1/2 z-[200] -translate-x-1/2 rounded-[var(--radius-card)] border border-[var(--success)] bg-success-soft px-4 py-2.5 text-sm font-medium text-ink shadow-lg transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {message}
    </div>
  );
}
