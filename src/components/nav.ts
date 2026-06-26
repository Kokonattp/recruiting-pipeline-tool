/** Single source of truth for the 4-module navigation. */
export interface NavItem {
  href: string;
  label: string;
  module: string;
  description: string;
}

/**
 * Order reflects the HR workday, not the assignment's module numbers:
 * the Tracker is the daily home (where you check who's where), so it sits first.
 * The module labels still carry the original numbering for traceability.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/tracker",
    label: "Applicant Tracker",
    module: "Module 3",
    description: "ภาพรวมผู้สมัครทุกคน ว่าใครอยู่ขั้นไหนของ pipeline",
  },
  {
    href: "/scraper",
    label: "Candidate Sourcing",
    module: "Module 1",
    description: "ค้นหา & รวบรวมผู้สมัครจากหลายแหล่งด้วย AI",
  },
  {
    href: "/screener",
    label: "Resume Screener",
    module: "Module 2",
    description: "ให้ AI ประเมิน CV เทียบ JD เป็นคะแนน 3 ด้าน",
  },
  {
    href: "/scheduler",
    label: "Interview Scheduler",
    module: "Module 4",
    description: "นัดสัมภาษณ์ผ่าน Google Meet พร้อม Meet link อัตโนมัติ",
  },
];
