"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, TextInput, Button } from "@/components/ui/Field";

export function PrintingRecordsFilterBar({
  lecturers,
  subjects,
}: {
  lecturers: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}) {
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

  const hasFilters =
    searchParams.get("lecturerId") ||
    searchParams.get("subjectId") ||
    searchParams.get("from") ||
    searchParams.get("to");

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Lecturer</label>
        <Select
          value={searchParams.get("lecturerId") ?? ""}
          onChange={(e) => updateParam("lecturerId", e.target.value)}
          className="w-auto"
        >
          <option value="">All lecturers</option>
          {lecturers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
        <Select
          value={searchParams.get("subjectId") ?? ""}
          onChange={(e) => updateParam("subjectId", e.target.value)}
          className="w-auto"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Printed From</label>
        <TextInput
          type="date"
          value={searchParams.get("from") ?? ""}
          onChange={(e) => updateParam("from", e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Printed To</label>
        <TextInput
          type="date"
          value={searchParams.get("to") ?? ""}
          onChange={(e) => updateParam("to", e.target.value)}
        />
      </div>
      {hasFilters && (
        <Button type="button" variant="secondary" onClick={() => router.push(pathname)}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
