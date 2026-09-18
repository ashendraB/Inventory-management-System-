import { getStockUsageReport, parseDateRange } from "@/server/report-service";
import { DateRangeFilterBar } from "@/components/reports/DateRangeFilterBar";
import { StatCard } from "@/components/reports/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StockUsageReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const { start, end } = parseDateRange(sp.from, sp.to);
  const report = await getStockUsageReport(start, end);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Stock Usage</h1>
        <p className="text-sm text-slate-500">Every stock quantity change in the selected period.</p>
      </div>

      <DateRangeFilterBar exportHref="/api/reports/stock-usage/export" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Transactions" value={report.totalTransactions.toLocaleString()} />
        {report.typeSummary.slice(0, 2).map((t) => (
          <StatCard
            key={t.type}
            label={t.type.replaceAll("_", " ")}
            value={`${t.count} (${t.totalQuantity > 0 ? "+" : ""}${t.totalQuantity.toLocaleString()})`}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Count</th>
              <th className="px-4 py-3">Net Change</th>
            </tr>
          </thead>
          <tbody>
            {report.typeSummary.map((t) => (
              <tr key={t.type} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <StatusBadge status={t.type} />
                </td>
                <td className="px-4 py-3">{t.count}</td>
                <td className={`px-4 py-3 ${t.totalQuantity < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {t.totalQuantity > 0 ? "+" : ""}
                  {t.totalQuantity.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Lot</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">New Qty</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {report.transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No stock transactions in this period.
                </td>
              </tr>
            ) : (
              report.transactions.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0 transition-colors hover:bg-brand-50/60">
                  <td className="px-4 py-3 text-slate-500">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.type} />
                  </td>
                  <td className="px-4 py-3">
                    {t.inventoryItem.itemCode} — {t.inventoryItem.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.lot?.lotCode ?? "—"}</td>
                  <td className={`px-4 py-3 ${t.quantityChange < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {t.quantityChange > 0 ? "+" : ""}
                    {t.quantityChange.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{t.newQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">{t.user.name}</td>
                  <td className="px-4 py-3 text-slate-500">{t.reason ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
