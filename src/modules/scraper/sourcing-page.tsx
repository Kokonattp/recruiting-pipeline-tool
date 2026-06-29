"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobDescription } from "@/lib/types";
import { JDGenerator } from "@/modules/jobs/jd-generator";
import { SourcingFlow } from "./sourcing-flow";
import { CsvImport } from "./csv-import";

type Tab = "generate" | "source" | "csv";

/**
 * Module 1 has two jobs: create a role (JD Generator) and find candidates for it
 * (Sourcing). A simple tab keeps each flow focused instead of one giant form.
 */
export function SourcingPage({ jobs }: { jobs: JobDescription[] }) {
  const router = useRouter();
  // If no JD exists yet, start on Generate so the user has something to source against.
  const [tab, setTab] = useState<Tab>(jobs.length === 0 ? "generate" : "source");

  return (
    <div className="space-y-6">
      <div className="inline-flex flex-wrap gap-1 rounded-[var(--radius-card)] border border-border bg-surface p-1">
        {(
          [
            ["generate", "1", "สร้างตำแหน่ง (JD)"],
            ["source", "2", "ค้นหาผู้สมัคร"],
            ["csv", "3", "นำเข้า CSV"],
          ] as const
        ).map(([id, step, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={[
              "flex items-center gap-2 rounded-[calc(var(--radius-card)-3px)] px-3.5 py-1.5 text-sm font-semibold transition-colors",
              tab === id ? "bg-primary text-primary-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                tab === id ? "bg-primary-ink/20 text-primary-ink" : "bg-surface-2 text-ink-3",
              ].join(" ")}
            >
              {step}
            </span>
            {label}
          </button>
        ))}
      </div>

      {tab === "generate" && (
        <JDGenerator
          onSaved={() => {
            router.refresh(); // reload server data so the new JD appears in the source tab
            setTab("source");
          }}
        />
      )}
      {tab === "source" && <SourcingFlow jobs={jobs} />}
      {tab === "csv" && <CsvImport jobs={jobs} />}
    </div>
  );
}
