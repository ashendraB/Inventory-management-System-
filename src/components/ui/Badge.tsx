import { clsx } from "clsx";

export type BadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info";

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
  info: "bg-brand-50 text-brand-700 ring-brand-600/20",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors duration-150",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** A Badge for a raw enum-style status (e.g. "OUT_OF_STOCK") — colors and
 * humanizes it ("OUT OF STOCK") in one place. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={statusTone(status)} className={className}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

/** Maps the common domain statuses used across the app to a Badge tone. */
export function statusTone(status: string): BadgeTone {
  switch (status) {
    case "ACTIVE":
    case "PAID":
      return "success";
    case "LOW_STOCK":
    case "PENDING":
    case "DRAFT":
      return "warning";
    case "OUT_OF_STOCK":
    case "CANCELLED":
      return "danger";
    case "FINISHED":
    case "ISSUED":
    case "GENERATED":
      return "info";
    default:
      return "neutral";
  }
}
