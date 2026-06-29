/** Single source of truth for the 4-module navigation. */
export interface NavItem {
  href: string;
  label: string;
  module: string;
  description: string;
}

/**
 * Ordered by the assignment's module numbers (1 → 4), which also reads as the natural
 * recruiting pipeline: source candidates → screen them → track them → schedule interviews.
 */
export const NAV_ITEMS: NavItem[] = [
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
    href: "/tracker",
    label: "Applicant Tracker",
    module: "Module 3",
    description: "ภาพรวมผู้สมัครทุกคน ว่าใครอยู่ขั้นไหนของ pipeline",
  },
  {
    href: "/scheduler",
    label: "Interview Scheduler",
    module: "Module 4",
    description: "นัดสัมภาษณ์ผ่าน Google Meet พร้อม Meet link อัตโนมัติ",
  },
];
