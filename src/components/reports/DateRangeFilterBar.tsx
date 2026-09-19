"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TextInput, Button } from "@/components/ui/Field";

export function DateRangeFilterBar({ exportHref }: { exportHref?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-brand-700 bg-brand-800 p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">From</label>
          <TextInput
            type="date"
            value={searchParams.get("from") ?? ""}
            onChange={(e) => updateParam("from", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200">To</label>
          <TextInput
            type="date"
            value={searchParams.get("to") ?? ""}
            onChange={(e) => updateParam("to", e.target.value)}
          />
        </div>
        {(searchParams.get("from") || searchParams.get("to")) && (
          <Button type="button" variant="secondary" onClick={() => router.push(pathname)}>
            Reset (last 30 days)
          </Button>
        )}
      </div>
      {exportHref && (
        <a
          href={`${exportHref}?${searchParams.toString()}`}
          className="rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-gold-500/50 hover:bg-white/10"
        >
          Download CSV
        </a>
      )}
    </div>
  );
}
