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
      { label: "Barcode Generator", href: "/inventory/barcodes", roles: ALL, implemented: true },
      { label: "Stock / Lots", href: "/inventory/lots", roles: ADMIN_INV, implemented: true },
      { label: "Stock Transactions", href: "/inventory/transactions", roles: ADMIN_INV, implemented: true },
      { label: "Suppliers", href: "/inventory/suppliers", roles: ADMIN, implemented: true },
    ],
  },
  {
    label: "Printing",
    roles: ADMIN_PRINT,
    links: [
      { label: "Printing Calculator", href: "/printing/calculator", roles: ADMIN_PRINT, implemented: false },
      { label: "Printing Records", href: "/printing/records", roles: ADMIN_PRINT, implemented: false },
      { label: "Active Paper Stock", href: "/printing/active-stock", roles: ALL, implemented: false },
      { label: "Printing Price Configuration", href: "/printing/price-config", roles: ADMIN, implemented: false },
    ],
  },
  {
    label: "Lecturers",
    roles: ADMIN_PRINT,
    links: [
      { label: "Lecturer List", href: "/lecturers", roles: ADMIN_PRINT, implemented: false },
      { label: "Add Lecturer", href: "/lecturers/new", roles: ADMIN, implemented: false },
    ],
  },
  {
    label: "Billing",
    roles: ADMIN,
    links: [
      { label: "Monthly Billing", href: "/billing/monthly", roles: ADMIN, implemented: false },
      { label: "Invoices", href: "/billing/invoices", roles: ADMIN, implemented: false },
      { label: "Invoice History", href: "/billing/invoices/history", roles: ADMIN, implemented: false },
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
      { label: "Paper Sizes", href: "/settings/paper-sizes", roles: ADMIN, implemented: false },
      { label: "GSM", href: "/settings/gsm", roles: ADMIN, implemented: false },
      { label: "Paper Types", href: "/settings/paper-types", roles: ADMIN, implemented: false },
      { label: "System Settings", href: "/settings/system", roles: ADMIN, implemented: false },
    ],
  },
];

/** Flat list of every route this app knows about, for middleware access checks. */
export function findRouteRule(pathname: string): {
  roles: UserRole[];
  implemented: boolean;
} | null {
  for (const section of NAV) {
    if (section.href && pathname.startsWith(section.href)) {
      return { roles: section.roles, implemented: section.implemented ?? true };
    }
    if (section.links) {
      for (const link of section.links) {
        if (pathname === link.href || pathname.startsWith(link.href + "/")) {
          return { roles: link.roles, implemented: link.implemented };
        }
      }
    }
  }
  return null;
}
