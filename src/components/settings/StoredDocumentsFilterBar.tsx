"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Select, TextInput, Button } from "@/components/ui/Field";

const PRESETS = [
  { value: "", label: "All" },
  { value: "week", label: "Last Week" },
  { value: "month", label: "Last Month" },
] as const;

export function StoredDocumentsFilterBar({
  lecturers,
  grades,
}: {
  lecturers: { id: string; name: string }[];
  grades: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const preset = searchParams.get("preset") ?? "";
  const month = searchParams.get("month") ?? "";
  const lecturerId = searchParams.get("lecturerId") ?? "";
  const gradeId = searchParams.get("gradeId") ?? "";
  const urlSearch = searchParams.get("search") ?? "";
  const hasFilters = preset || month || lecturerId || gradeId || urlSearch;

  // The box updates as you type; the page is refreshed shortly after you stop
  // typing rather than on every keystroke.
  const [search, setSearch] = useState(urlSearch);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== urlSearch) setParam("search", search.trim());
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

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
      <div className="w-full sm:w-72">
        <label htmlFor="doc-search" className="mb-1 block text-sm font-medium text-slate-200">
          Search
        </label>
        <TextInput
          id="doc-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Document name, printing ID or lecturer"
          autoComplete="off"
        />
      </div>
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
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-200">Lecturer</label>
        <Select
          value={lecturerId}
          onChange={(e) => setParam("lecturerId", e.target.value)}
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
        <label className="mb-1 block text-sm font-medium text-slate-200">Grade</label>
        <Select
          value={gradeId}
          onChange={(e) => setParam("gradeId", e.target.value)}
          className="w-auto"
        >
          <option value="">All grades</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>
      {hasFilters && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSearch("");
            router.push(pathname);
          }}
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
