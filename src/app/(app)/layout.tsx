import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { NAV, type NavSection } from "@/config/nav";
import { AppShell } from "@/components/layout/AppShell";

function filterNavForRole(role: string): NavSection[] {
  return NAV.filter((section) => section.roles.includes(role as never))
    .map((section) => ({
      ...section,
      links: section.links?.filter((link) => link.roles.includes(role as never)),
    }))
    .filter((section) => !section.links || section.links.length > 0);
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  // Middleware already guarantees this, but never trust only one layer.
  if (!session) redirect("/login");

  const nav = filterNavForRole(session.role);

  return (
    <AppShell nav={nav} user={{ name: session.name, role: session.role }}>
      {children}
    </AppShell>
  );
}
