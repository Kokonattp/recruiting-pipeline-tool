/** Single source of truth for the 4-module navigation. */
export interface NavItem {
  href: string;
  label: string;
  module: string;
  description: string;
}

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
    description: "ติดตามสถานะผู้สมัครทุกคนใน pipeline",
  },
  {
    href: "/scheduler",
    label: "Interview Scheduler",
    module: "Module 4",
    description: "นัดสัมภาษณ์ผ่าน Google Meet อัตโนมัติ",
  },
];
