import { redirect } from "next/navigation";

// HR tools open straight into the workspace — no marketing landing.
// The Tracker is the daily home base, so / redirects there.
export default function Home() {
  redirect("/tracker");
}
