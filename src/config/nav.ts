import type { UserRole } from "@prisma/client";

export interface NavLink {
  label: string;
  href: string;
  roles: UserRole[];
  implemented: boolean;
}

export interface NavSection {
  label: string;
  href?: string;
  roles: UserRole[];
  links?: NavLink[];
  implemented?: boolean;
}

const ALL: UserRole[] = [
  "ADMINISTRATOR",
  "INVENTORY_OPERATOR",
  "PRINTING_OPERATOR",
];
const ADMIN: UserRole[] = ["ADMINISTRATOR"];
const ADMIN_INV: UserRole[] = ["ADMINISTRATOR", "INVENTORY_OPERATOR"];
const ADMIN_PRINT: UserRole[] = ["ADMINISTRATOR", "PRINTING_OPERATOR"];

/**
 * Single source of truth for navigation AND route access control.
 * `implemented: false` items render as disabled ("coming soon") in the
 * sidebar and are blocked by middleware even for roles that could see them,
 * so unbuilt phases never 404 or half-render.
 */
export const NAV: NavSection[] = [
  { label: "Dashboard", href: "/dashboard", roles: ALL, implemented: true },
  {
    label: "Inventory",
    roles: ALL,
    links: [
      { label: "Inventory Items", href: "/inventory/items", roles: ADMIN_INV, implemented: true },
      { label: "Add Inventory Item", href: "/inventory/items/new", roles: ADMIN_INV, implemented: true },
      { label: "Barcode Reader", href: "/inventory/barcodes", roles: ALL, implemented: true },
      { label: "Stock", href: "/inventory/lots", roles: ADMIN_INV, implemented: true },
      { label: "Suppliers", href: "/inventory/suppliers", roles: ADMIN, implemented: true },
    ],
  },
  {
    label: "Printing",
    roles: ADMIN_PRINT,
    links: [
      { label: "Printing Calculator", href: "/printing/calculator", roles: ADMIN_PRINT, implemented: true },
      { label: "Printing Records", href: "/printing/records", roles: ADMIN_PRINT, implemented: true },
      { label: "Active Paper Stock", href: "/printing/active-stock", roles: ADMIN_PRINT, implemented: true },
      { label: "Printing Price Configuration", href: "/printing/price-config", roles: ADMIN, implemented: true },
    ],
  },
  {
    label: "Lecturers",
    roles: ADMIN_PRINT,
    links: [
      { label: "Lecturer List", href: "/lecturers", roles: ADMIN_PRINT, implemented: true },
      { label: "Add Lecturer", href: "/lecturers/new", roles: ADMIN, implemented: true },
    ],
  },
  {
    label: "Billing",
    roles: ADMIN,
    links: [
      { label: "Monthly Billing", href: "/billing/monthly", roles: ADMIN, implemented: true },
      { label: "Invoices", href: "/billing/invoices", roles: ADMIN, implemented: true },
      { label: "Invoice History", href: "/billing/invoices/history", roles: ADMIN, implemented: true },
    ],
  },
  {
    label: "Reports",
    roles: ADMIN,
    links: [
      { label: "Inventory Reports", href: "/reports/inventory", roles: ADMIN, implemented: false },
      { label: "Stock Usage", href: "/reports/stock-usage", roles: ADMIN, implemented: false },
      { label: "Printing Reports", href: "/reports/printing", roles: ADMIN, implemented: false },
      { label: "Lecturer Reports", href: "/reports/lecturers", roles: ADMIN, implemented: false },
      { label: "Cost Reports", href: "/reports/costs", roles: ADMIN, implemented: false },
    ],
  },
  {
    label: "Settings",
    roles: ADMIN,
    links: [
      { label: "Users", href: "/settings/users", roles: ADMIN, implemented: false },
      { label: "Paper Sizes", href: "/settings/paper-sizes", roles: ADMIN, implemented: true },
      { label: "GSM", href: "/settings/gsm", roles: ADMIN, implemented: true },
      { label: "Paper Types", href: "/settings/paper-types", roles: ADMIN, implemented: true },
      { label: "System Settings", href: "/settings/system", roles: ADMIN, implemented: false },
    ],
  },
];

/** Flat list of every route this app knows about, for middleware access checks.
 * Picks the *most specific* (longest href) match rather than the first one
 * found — e.g. "/lecturers/new" (Administrator only) must win over the more
 * general "/lecturers" (Administrator + Printing Operator) it's nested
 * under, even though "Lecturer List" is declared first for sidebar-ordering
 * reasons. */
export function findRouteRule(pathname: string): {
  roles: UserRole[];
  implemented: boolean;
} | null {
  let best: { href: string; roles: UserRole[]; implemented: boolean } | null = null;

  function consider(href: string, roles: UserRole[], implemented: boolean) {
    if (pathname !== href && !pathname.startsWith(href + "/")) return;
    if (!best || href.length > best.href.length) {
      best = { href, roles, implemented };
    }
  }

  for (const section of NAV) {
    if (section.href) consider(section.href, section.roles, section.implemented ?? true);
    if (section.links) {
      for (const link of section.links) {
        consider(link.href, link.roles, link.implemented);
      }
    }
  }

  return best;
}
