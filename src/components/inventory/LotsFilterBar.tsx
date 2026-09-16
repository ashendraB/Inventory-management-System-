"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/Field";

const STATUSES = ["ACTIVE", "LOW_STOCK", "OUT_OF_STOCK", "FINISHED", "INACTIVE"];

export function LotsFilterBar({ items }: { items: { id: string; name: string; itemCode: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={searchParams.get("itemId") ?? ""}
        onChange={(e) => updateParam("itemId", e.target.value)}
        className="w-auto"
      >
        <option value="">All items</option>
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.itemCode} — {i.name}
          </option>
        ))}
      </Select>
      <Select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="w-auto"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll("_", " ")}
          </option>
        ))}
      </Select>
    </div>
  );
}
