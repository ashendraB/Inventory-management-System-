import Link from "next/link";
import { formatRelative } from "@/lib/format";

export interface ActivityRow {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  /** Right-hand headline figure, e.g. a cost. */
  value?: React.ReactNode;
  date: Date;
}

/** One card of the dashboard's Recent Activity: icon + title, a "View all"
 * link, then rows (title/subtitle on the left, figure + relative time on the
 * right). Each row links through to the record. */
export function ActivityPanel({
  title,
  icon,
  viewAllHref,
  emptyText,
  emptyHref,
  emptyLabel,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  viewAllHref: string;
  emptyText: string;
  emptyHref: string;
  emptyLabel: string;
  rows: ActivityRow[];
}) {
  return (
    <section className="flex flex-col rounded-xl border border-brand-700 bg-brand-800 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/15 text-gold-400">
            {icon}
          </span>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <Link
          href={viewAllHref}
          className="text-xs font-medium text-gold-400 transition-colors hover:text-gold-300 hover:underline"
        >
          View all →
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <p className="text-sm text-slate-400">{emptyText}</p>
          <Link href={emptyHref} className="text-sm font-medium text-gold-400 hover:underline">
            {emptyLabel}
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className="flex items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-100">{row.title}</p>
                  <p className="truncate text-xs text-slate-400">{row.subtitle}</p>
                </div>
                <div className="shrink-0 text-right">
                  {row.value !== undefined && (
                    <div className="text-sm font-semibold text-gold-400">{row.value}</div>
                  )}
                  <p className="text-xs text-slate-400">{formatRelative(row.date)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const ICON_PROPS = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ActivityIcons = {
  inventory: (
    <svg {...ICON_PROPS}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  lots: (
    <svg {...ICON_PROPS}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  printing: (
    <svg {...ICON_PROPS}>
      <path d="M7 9V3h10v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M7 14h10v7H7z" />
    </svg>
  ),
  invoices: (
    <svg {...ICON_PROPS}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  ),
};
