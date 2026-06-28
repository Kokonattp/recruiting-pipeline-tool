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
      <div className="inline-flex rounded-[var(--radius-card)] border border-border p-0.5">
        {(
          [
            ["generate", "1 · สร้างตำแหน่ง (JD)"],
            ["source", "2 · ค้นหาผู้สมัคร"],
            ["csv", "3 · นำเข้า CSV"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={[
              "rounded-[calc(var(--radius-card)-2px)] px-3.5 py-1.5 text-sm font-medium transition-colors",
              tab === id ? "bg-primary text-primary-ink" : "text-ink-2 hover:text-ink",
            ].join(" ")}
          >
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
