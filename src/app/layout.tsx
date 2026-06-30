import type { Metadata } from "next";
import { Prompt, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { NavLoading } from "@/components/nav-loading";
import { getCurrentUser } from "@/lib/auth";

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Auth gate is enforced by middleware; here we just decide chrome. Signed-out users
  // only ever see /login (which renders its own full-screen layout, no sidebar).
  const user = await getCurrentUser().catch(() => null);

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
        {user ? (
          <div className="flex min-h-screen flex-col lg:flex-row">
            <NavLoading />
            <Sidebar userEmail={user.email} />
            <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
