import { getPrintingReport, parseDateRange } from "@/server/report-service";
import { DateRangeFilterBar } from "@/components/reports/DateRangeFilterBar";
import { StatCard } from "@/components/reports/StatCard";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PrintingReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const { start, end } = parseDateRange(sp.from, sp.to);
  const report = await getPrintingReport(start, end);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">Printing Reports</h1>
        <p className="text-sm text-slate-400">Printing activity for the selected period.</p>
      </div>

      <DateRangeFilterBar exportHref="/api/reports/printing/export" />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Jobs" value={report.totalJobs.toLocaleString()} />
        <StatCard
          label="Sheets"
          value={report.totalSheets.toLocaleString()}
          hint={report.totalWastedSheets > 0 ? `+${report.totalWastedSheets} wasted` : undefined}
        />
        <StatCard label="Revenue" value={formatCurrency(report.totalRevenue)} />
        <StatCard label="Paper Cost" value={formatCurrency(report.totalPaperCost)} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-700 bg-brand-800 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Paper</th>
              <th className="px-4 py-3">Jobs</th>
              <th className="px-4 py-3">Sheets</th>
              <th className="px-4 py-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {report.paperSummary.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No printing jobs in this period.
                </td>
              </tr>
            ) : (
              report.paperSummary.map((p) => (
                <tr key={p.paper} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3 font-medium">{p.paper}</td>
                  <td className="px-4 py-3">{p.jobCount}</td>
                  <td className="px-4 py-3">{p.sheets.toLocaleString()}</td>
                  <td className="px-4 py-3">{formatCurrency(p.totalCost)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-700 bg-brand-800 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Sheets</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {report.records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No printing jobs in this period.
                </td>
              </tr>
            ) : (
              report.records.map((r) => (
                <tr key={r.id} className="border-b border-white/10 last:border-0 transition-colors hover:bg-white/5">
                  <td className="px-4 py-3 text-slate-400">{r.printingCode}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(r.date)}</td>
                  <td className="px-4 py-3">{r.lecturer.name}</td>
                  <td className="px-4 py-3">{r.documentName}</td>
                  <td className="px-4 py-3">{r.physicalSheets.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(Number(r.totalCost))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
