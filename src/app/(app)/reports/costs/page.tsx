import { getCostReport, parseDateRange } from "@/server/report-service";
import { DateRangeFilterBar } from "@/components/reports/DateRangeFilterBar";
import { StatCard } from "@/components/reports/StatCard";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

export default async function CostReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const { start, end } = parseDateRange(sp.from, sp.to);
  const report = await getCostReport(start, end);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">Cost Reports</h1>
        <p className="text-sm text-slate-400">
          Paper cost vs. printing charge for the selected period, by month.
        </p>
      </div>

      <DateRangeFilterBar exportHref="/api/reports/costs/export" />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(report.totalRevenue)} />
        <StatCard
          label="Paper Cost"
          value={formatCurrency(report.totalPaperCost)}
          hint={`${(report.paperCostShare * 100).toFixed(1)}% of revenue`}
        />
        <StatCard
          label="Printing Charge"
          value={formatCurrency(report.totalPrintingCharge)}
          hint={`${(report.printingChargeShare * 100).toFixed(1)}% of revenue`}
        />
        <StatCard label="Months" value={report.monthly.length.toLocaleString()} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-700 bg-brand-800 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Paper Cost</th>
              <th className="px-4 py-3">Printing Charge</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {report.monthly.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  No printing jobs in this period.
                </td>
              </tr>
            ) : (
              report.monthly.map((m) => (
                <tr key={m.month} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3 font-medium">{monthLabel(m.month)}</td>
                  <td className="px-4 py-3 text-slate-400">{formatCurrency(m.paperCost)}</td>
                  <td className="px-4 py-3 text-slate-400">{formatCurrency(m.printingCharge)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(m.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
