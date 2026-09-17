import Link from "next/link";
import { getLecturerReport, parseDateRange } from "@/server/report-service";
import { DateRangeFilterBar } from "@/components/reports/DateRangeFilterBar";
import { StatCard } from "@/components/reports/StatCard";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LecturerReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const { start, end } = parseDateRange(sp.from, sp.to);
  const report = await getLecturerReport(start, end);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Lecturer Reports</h1>
        <p className="text-sm text-slate-500">Per-lecturer printing usage for the selected period.</p>
      </div>

      <DateRangeFilterBar exportHref="/api/reports/lecturers/export" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lecturers with Jobs" value={report.rows.length.toLocaleString()} />
        <StatCard label="Total Jobs" value={report.totalJobs.toLocaleString()} />
        <StatCard label="Total Cost" value={formatCurrency(report.totalCost)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3">Jobs</th>
              <th className="px-4 py-3">Sheets</th>
              <th className="px-4 py-3">Total Cost</th>
              <th className="px-4 py-3">Billing Status</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No printing jobs in this period.
                </td>
              </tr>
            ) : (
              report.rows.map((r) => {
                const unbilled = r.jobCount - r.billedJobCount;
                return (
                  <tr key={r.lecturerId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium">{r.lecturerName}</span>{" "}
                      <span className="text-slate-400">({r.lecturerCode})</span>
                    </td>
                    <td className="px-4 py-3">{r.jobCount}</td>
                    <td className="px-4 py-3">{r.sheets.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(r.totalCost)}</td>
                    <td className="px-4 py-3">
                      {unbilled === 0 ? (
                        <Badge tone="success">all billed</Badge>
                      ) : (
                        <Badge tone="warning">{unbilled} unbilled</Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Link href="/billing/monthly" className="text-sm text-indigo-600 hover:underline">
        Go to Monthly Billing →
      </Link>
    </div>
  );
}
