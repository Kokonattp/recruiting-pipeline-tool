import type { Metadata } from "next";
import { Prompt, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

// Prompt carries both Thai and Latin in one family — per impeccable's product register,
// one well-tuned sans for headings, labels, body and data beats pairing two.
const prompt = Prompt({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
      className={`${prompt.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden px-8 py-7">{children}</main>
        </div>
      </body>
    </html>
  );
}
