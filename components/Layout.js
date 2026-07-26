import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { LayoutDashboard, ArrowLeftRight, Wallet, FileText, Target, Palette, LogOut, Settings } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

const NAV = [
  { href: "/", label: "Dashboard", mark: "01", Icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", mark: "02", Icon: ArrowLeftRight },
  { href: "/accounts", label: "Rekening", mark: "03", Icon: Wallet },
  { href: "/budgets", label: "Anggaran", mark: "04", Icon: Target },
  { href: "/reports", label: "Laporan", mark: "05", Icon: FileText },
];

export default function Layout({ children }) {
  const { session, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [session, router]);

  if (session === undefined || session === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="font-mono text-sm text-muted">Memuat…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper md:flex">
      {/* Top bar - mobile only */}
      <div className="no-print md:hidden flex items-center justify-between px-4 py-4 border-b border-line bg-surface sticky top-0 z-20">
        <p className="font-display text-xl font-semibold text-ink leading-none">
          Ledgy<span className="text-ledger">.</span>
        </p>
        <div className="flex items-center gap-3">
          <Link href="/settings" aria-label="Tema warna" className="text-ink/70">
            <Settings size={18} />
          </Link>
          <button
            onClick={signOut}
            aria-label="Keluar"
            className="flex items-center gap-1.5 text-sm text-rust"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Bottom tab bar - mobile only */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-line flex">
        {NAV.map((item) => {
          const active = router.pathname === item.href;
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                active ? "text-ledgerDark font-medium" : "text-muted"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar - desktop only */}
      <aside className="no-print hidden md:flex w-60 shrink-0 border-r border-line bg-surface flex-col">
        <div className="px-6 py-7 border-b border-line">
          <p className="font-display text-2xl font-semibold text-ink leading-none">
            Ledgy<span className="text-ledger">.</span>
          </p>
          <p className="text-xs text-muted mt-1">Private Ledger & Budgeting</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((item) => {
            const active = router.pathname === item.href;
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  active
                    ? "bg-ledger/10 text-ledgerDark font-medium border-r-2 border-ledger"
                    : "text-ink/70 hover:bg-ink/5"
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.3 : 1.8} />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
              router.pathname === "/settings"
                ? "bg-ledger/10 text-ledgerDark font-medium border-r-2 border-ledger"
                : "text-ink/70 hover:bg-ink/5"
            }`}
          >
            <Settings size={17} strokeWidth={router.pathname === "/settings" ? 2.3 : 1.8} />
            Pengaturan
          </Link>
        </nav>
        <div className="px-6 py-5 border-t border-line">
          <p className="text-xs text-muted mb-2 truncate">
            {session.user.email}
          </p>
          <button
            onClick={signOut}
            className="text-sm text-rust hover:underline"
          >
            Keluar
          </button>
          <p className="text-[11px] text-muted mt-4">
            © 2026 Ledgy by Zahid. All rights reserved.
          </p>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 pb-20 md:px-10 md:py-8 md:pb-8 min-w-0 flex flex-col">
        <div className="flex-1">{children}</div>
        <p className="no-print md:hidden text-center text-[11px] text-muted mt-10 pt-6 border-t border-line">
          © 2026 Ledgy by Zahid. All rights reserved.
        </p>
      </main>
    </div>
  );
}
