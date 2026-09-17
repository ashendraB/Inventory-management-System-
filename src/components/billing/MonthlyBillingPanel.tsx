"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Select, Button } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/format";

interface UnbilledRow {
  lecturerId: string;
  lecturerName: string;
  lecturerCode: string;
  jobCount: number;
  totalPaperCost: number;
  totalPrintingCharge: number;
  grandTotal: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthlyBillingPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<UnbilledRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/unbilled?year=${year}&month=${month}`);
      const data = await res.json();
      setRows(res.ok ? data.summary : []);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function generateOne(lecturerId: string) {
    setGeneratingId(lecturerId);
    try {
      const res = await fetch("/api/billing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lecturerId, year, month }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not generate this invoice.");
        return;
      }
      toast.success(`Invoice ${data.result.invoice.invoiceNumber} generated`);
      await load();
    } finally {
      setGeneratingId(null);
    }
  }

  async function generateAll() {
    setGeneratingAll(true);
    try {
      const res = await fetch("/api/billing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not generate invoices.");
        return;
      }
      const created = data.results.filter((r: { result: unknown }) => r.result).length;
      toast.success(`Generated ${created} invoice${created === 1 ? "" : "s"}`);
      await load();
    } finally {
      setGeneratingAll(false);
    }
  }

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Month</label>
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-40">
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Year</label>
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28">
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {rows.length > 0 && (
          <Button type="button" onClick={generateAll} disabled={generatingAll}>
            {generatingAll ? "Generating..." : `Generate All (${rows.length})`}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3">Jobs</th>
              <th className="px-4 py-3">Paper Cost</th>
              <th className="px-4 py-3">Printing Charge</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No unbilled printing jobs for {MONTH_NAMES[month - 1]} {year}. Everything for
                  this month is already invoiced (or there were no jobs).
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.lecturerId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium">{row.lecturerName}</span>{" "}
                    <span className="text-slate-400">({row.lecturerCode})</span>
                  </td>
                  <td className="px-4 py-3">{row.jobCount}</td>
                  <td className="px-4 py-3 text-slate-500">{formatCurrency(row.totalPaperCost)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatCurrency(row.totalPrintingCharge)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(row.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => generateOne(row.lecturerId)}
                      disabled={generatingId === row.lecturerId}
                      className="text-indigo-600 hover:underline disabled:opacity-60"
                    >
                      {generatingId === row.lecturerId ? "Generating..." : "Generate Invoice"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Link href="/billing/invoices" className="text-sm text-indigo-600 hover:underline">
        View all invoices →
      </Link>
    </div>
  );
}
