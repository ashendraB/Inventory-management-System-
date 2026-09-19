"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import type { NavSection } from "@/config/nav";
import type { UserRole } from "@prisma/client";
import { SessionProvider } from "@/lib/session-context";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMINISTRATOR: "Administrator",
  INVENTORY_OPERATOR: "Inventory Operator",
  PRINTING_OPERATOR: "Printing Operator",
};

function Brand() {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
      <Image
        src="/logo.png"
        alt="Eminent Edification"
        width={38}
        height={38}
        className="h-[38px] w-[38px] shrink-0"
        priority
        unoptimized
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">Eminent Edification</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-gold-400">
          Knowledge is Power
        </p>
      </div>
    </div>
  );
}

export function AppShell({
  nav,
  user,
  children,
}: {
  nav: NavSection[];
  user: { name: string; role: UserRole };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.replace("/login");
    router.refresh();
  }

  const sidebarContent = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {nav.map((section) => {
        if (!section.links) {
          return (
            <Link
              key={section.href}
              href={section.href!}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "block rounded-md px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-150",
                pathname === section.href
                  ? "bg-gold-500 text-brand-900"
                  : "text-slate-200 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
              )}
            >
              {section.label}
            </Link>
          );
        }
        return (
          <div key={section.label}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gold-400/80">
              {section.label}
            </p>
            <div className="mt-1 space-y-0.5">
              {section.links.map((link) => {
                const active =
                  pathname === link.href || pathname.startsWith(link.href + "/");
                if (!link.implemented) {
                  return (
                    <span
                      key={link.href}
                      title="Coming soon"
                      className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-1.5 text-sm uppercase tracking-wide text-slate-400"
                    >
                      {link.label}
                      <span className="text-[10px] uppercase tracking-wide">
                        soon
                      </span>
                    </span>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      "block rounded-md border-l-2 px-3 py-1.5 text-sm uppercase tracking-wide transition-all duration-150",
                      active
                        ? "border-gold-500 bg-white/10 font-medium text-white"
                        : "border-transparent text-slate-300 hover:translate-x-0.5 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <SessionProvider session={user}>
    <div className="flex min-h-screen bg-brand-900">
      {/* Desktop sidebar */}
      <aside className="no-print hidden w-64 flex-col bg-brand-900 md:flex">
        <Brand />
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex w-64 flex-col bg-brand-900 shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Eminent Edification"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                  unoptimized
                />
                <span className="text-sm font-semibold text-white">Eminent Edification</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-slate-300 hover:text-white"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-14 items-center justify-between border-b border-gold-500/40 bg-brand-800 px-4 shadow-sm">
          <button
            className="text-slate-400 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{ROLE_LABEL[user.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-gold-500/50 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div key={pathname} className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
    </SessionProvider>
  );
}
