import { clsx } from "clsx";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <div className="rounded-xl border border-slate-200 border-t-2 border-t-gold-500 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={clsx(
          "mt-1 text-2xl font-semibold",
          tone === "warning" && "text-amber-600",
          tone === "danger" && "text-red-600",
          tone === "default" && "text-brand-800"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
