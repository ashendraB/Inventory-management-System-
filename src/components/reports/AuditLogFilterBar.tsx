"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Select, TextInput } from "@/components/ui/Field";

export function AuditLogFilterBar({
  actions,
  entityTypes,
}: {
  actions: string[];
  entityTypes: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) {
        updateParam("search", search);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-wrap gap-3">
      <TextInput
        placeholder="Search by action or entity ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />
      <Select
        value={searchParams.get("action") ?? ""}
        onChange={(e) => updateParam("action", e.target.value)}
        className="w-auto"
      >
        <option value="">All actions</option>
        {actions.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </Select>
      <Select
        value={searchParams.get("entityType") ?? ""}
        onChange={(e) => updateParam("entityType", e.target.value)}
        className="w-auto"
      >
        <option value="">All entity types</option>
        {entityTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
    </div>
  );
}
