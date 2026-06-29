import { signInWithGoogle } from "./actions";

export const metadata = { title: "เข้าสู่ระบบ" };

/**
 * Sign-in gate. One action: continue with Google (Supabase OAuth). The whole app sits
 * behind this; middleware redirects here when there's no session.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-4" style={{ backgroundImage: "var(--hero-wash)" }}>
      <div className="loga-card w-full max-w-sm rounded-2xl border bg-surface p-8 text-center">
        <span
          aria-hidden
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-ink shadow-[var(--shadow-primary)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 4h18l-7 8v7l-4 2v-9L3 4z" />
          </svg>
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-ink">Recruiting Pipeline</h1>
        <p className="mt-1 text-sm text-ink-2">เครื่องมือช่วยทีม HR สรรหาบุคลากรครบวงจร</p>

        {error && (
          <p className="mt-4 rounded-[var(--radius-card)] border border-[var(--danger)] bg-danger-soft px-3 py-2 text-sm text-ink">
            เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง
          </p>
        )}

        <form action={signInWithGoogle} className="mt-6">
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-[var(--radius-card)] bg-primary text-sm font-semibold text-primary-ink shadow-[var(--shadow-primary)] transition-transform hover:-translate-y-0.5"
          >
            <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-ink text-[11px] font-bold text-primary">G</span>
            เข้าสู่ระบบด้วย Google
          </button>
        </form>

        <p className="mt-4 text-xs text-ink-3">เฉพาะทีม HR ที่ได้รับอนุญาต</p>
      </div>
    </main>
  );
}
