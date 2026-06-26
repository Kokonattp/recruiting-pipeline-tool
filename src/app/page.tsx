import Link from "next/link";
import { NAV_ITEMS } from "@/components/nav";

const PIPELINE = ["Sourcing", "Screening", "Tracking", "Scheduling"];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b border-border pb-6">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-3">
          Recruiting Pipeline Tool
        </span>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink text-balance">
          จัดการการสรรหาบุคลากรครบวงจรในที่เดียว
        </h1>
        <p className="mt-2 max-w-prose text-sm text-ink-2">
          ตั้งแต่ค้นหาผู้สมัคร คัดกรองด้วย AI ติดตามสถานะ ไปจนถึงนัดสัมภาษณ์ — สำหรับตำแหน่ง{" "}
          <span className="font-medium text-ink">Senior AI Workflow &amp; Automation Engineer</span>
        </p>
      </header>

      {/* pipeline flow */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-ink-2">
        {PIPELINE.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <span className="rounded-full bg-surface-2 px-3 py-1 font-medium text-ink">{step}</span>
            {i < PIPELINE.length - 1 && <span className="text-ink-3">→</span>}
          </span>
        ))}
      </div>

      {/* 4 modules */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:border-border-strong"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-ink-3">
              {item.module}
            </span>
            <h2 className="mt-1 text-base font-semibold text-ink group-hover:text-primary">
              {item.label}
            </h2>
            <p className="mt-1 text-sm text-ink-2">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
