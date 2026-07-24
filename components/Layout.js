import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../lib/AuthContext";

const NAV = [
  { href: "/", label: "Dashboard", mark: "01" },
  { href: "/transactions", label: "Transaksi", mark: "02" },
  { href: "/accounts", label: "Rekening", mark: "03" },
  { href: "/reports", label: "Laporan", mark: "04" },
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
    <div className="min-h-screen bg-paper flex">
      <aside className="no-print w-60 shrink-0 border-r border-line bg-surface flex flex-col">
        <div className="px-6 py-7 border-b border-line">
          <p className="font-display text-2xl font-semibold text-ink leading-none">
            Ledger<span className="text-ledger">.</span>
          </p>
          <p className="text-xs text-muted mt-1">Buku kas pribadi</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((item) => {
            const active = router.pathname === item.href;
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
                <span className="font-mono text-xs text-muted">{item.mark}</span>
                {item.label}
              </Link>
            );
          })}
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
        </div>
      </aside>
      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
