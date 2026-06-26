import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Thai is a first-class citizen (PRODUCT.md) — pair Geist (Latin) with Plex Sans Thai.
const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Recruiting Pipeline Tool",
    template: "%s · Recruiting Pipeline",
  },
  description:
    "เครื่องมือช่วยทีม HR จัดการกระบวนการสรรหาบุคลากรครบวงจร — sourcing, screening, tracking, scheduling ในที่เดียว",
  applicationName: "Recruiting Pipeline Tool",
  authors: [{ name: "Recruiting Pipeline" }],
  keywords: ["recruiting", "ATS", "HR", "AI screening", "applicant tracker"],
};

// Runs before paint to apply the saved theme — prevents a light/dark flash.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${plexThai.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
