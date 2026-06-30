"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobDescription } from "@/lib/types";
import { JDGenerator } from "@/modules/jobs/jd-generator";
import { JDManager } from "@/modules/jobs/jd-manager";
import { SourcingFlow } from "./sourcing-flow";
import { PdfImport } from "./pdf-import";

type Tab = "generate" | "manage" | "source" | "pdf";

export function SourcingPage({ jobs }: { jobs: JobDescription[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(jobs.length === 0 ? "generate" : "source");

  const tabs: [Tab, string, string][] = [
    ["generate", "1", "สร้างตำแหน่ง (JD)"],
    ["manage", "☰", "จัดการ JD"],
    ["source", "2", "ค้นหาผู้สมัคร"],
    ["pdf", "3", "นำเข้า Resume"],
  ];

  return (
    <div className="space-y-6">
      <div className="inline-flex flex-wrap gap-1 rounded-[var(--radius-card)] border border-border bg-surface p-1">
        {tabs.map(([id, step, label]) => (
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
            router.refresh();
            setTab("source");
          }}
        />
      )}
      {tab === "manage" && (
        <JDManager jobs={jobs} onRefresh={() => router.refresh()} />
      )}
      {tab === "source" && <SourcingFlow jobs={jobs} />}
      {tab === "pdf" && <PdfImport jobs={jobs} />}
    </div>
  );
}
