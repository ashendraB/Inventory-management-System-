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
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">From</label>
          <TextInput
            type="date"
            value={searchParams.get("from") ?? ""}
            onChange={(e) => updateParam("from", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">To</label>
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
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Download CSV
        </a>
      )}
    </div>
  );
}
