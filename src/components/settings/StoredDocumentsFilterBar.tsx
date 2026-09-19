"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { clsx } from "clsx";
import { TextInput } from "@/components/ui/Field";

const PRESETS = [
  { value: "", label: "All" },
  { value: "week", label: "Last Week" },
  { value: "month", label: "Last Month" },
] as const;

export function StoredDocumentsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preset = searchParams.get("preset") ?? "";
  const month = searchParams.get("month") ?? "";

  function setPreset(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("month");
    if (value) params.set("preset", value);
    else params.delete("preset");
    router.push(`${pathname}?${params.toString()}`);
  }

  function setMonth(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("preset");
    if (value) params.set("month", value);
    else params.delete("month");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-brand-700 bg-brand-800 p-4 shadow-sm">
      <div className="flex gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPreset(p.value)}
            className={clsx(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              !month && preset === p.value
                ? "bg-gold-500 text-brand-900"
                : "border border-white/20 text-slate-200 hover:bg-white/10"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Selected Month</label>
        <TextInput type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>
    </div>
  );
}
