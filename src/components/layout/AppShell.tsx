"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import type { NavSection } from "@/config/nav";
import type { UserRole } from "@prisma/client";

const ROLE_LABEL: Record<UserRole, string> = {
  ADMINISTRATOR: "Administrator",
  INVENTORY_OPERATOR: "Inventory Operator",
  PRINTING_OPERATOR: "Printing Operator",
};

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
                "block rounded-md px-3 py-2 text-sm font-semibold",
                pathname === section.href
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {section.label}
            </Link>
          );
        }
        return (
          <div key={section.label}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                      className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-1.5 text-sm text-slate-300"
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
                      "block rounded-md px-3 py-1.5 text-sm",
                      active
                        ? "bg-indigo-50 font-medium text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100"
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            IB
          </div>
          <span className="text-sm font-semibold text-slate-900">
            Inventory &amp; Billing
          </span>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
              <span className="text-sm font-semibold text-slate-900">
                Inventory &amp; Billing
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-slate-500"
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
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
          <button
            className="text-slate-500 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
