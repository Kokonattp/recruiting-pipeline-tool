"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { ScreeningResult } from "@/lib/types";
import { ScoreCard } from "@/modules/screener/score-card";

/**
 * Small trigger + portal dialog that surfaces the full Module 2 screening result
 * (per-axis reasoning, strengths, prescreen questions, panel summary) from a Tracker
 * card/row — today only the 3 numeric scores are visible there, the qualitative
 * write-up is otherwise stranded on the Screener page the moment you navigate away.
 */
export function ScreeningDetailButton({
  screening,
  candidateName,
  jobTitle,
}: {
  screening: ScreeningResult;
  candidateName: string;
  jobTitle?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] font-medium text-primary hover:underline"
      >
        ดูรายละเอียด
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="loga-card max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-card)] border bg-bg p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <ScoreCard
                screening={screening}
                recommendation={screening.recommendation}
                candidateName={candidateName}
                jobTitle={jobTitle}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="no-print mt-4 h-9 w-full rounded-[var(--radius-card)] border border-border text-sm font-medium text-ink-2 hover:bg-surface-2"
              >
                ปิด
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
