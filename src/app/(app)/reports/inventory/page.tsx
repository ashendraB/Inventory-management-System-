import { getInventoryReport } from "@/server/report-service";
import { StatCard } from "@/components/reports/StatCard";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InventoryReportPage() {
  const report = await getInventoryReport();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Inventory Reports</h1>
          <p className="text-sm text-slate-500">Current stock snapshot across every item.</p>
        </div>
        <a
          href="/api/reports/inventory/export"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Download CSV
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Items" value={report.totalItems.toLocaleString()} />
        <StatCard label="Total Stock Value" value={formatCurrency(report.totalValue)} />
        <StatCard label="Low Stock" value={report.lowStockCount.toLocaleString()} />
        <StatCard label="Out of Stock" value={report.outOfStockCount.toLocaleString()} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total Stock</th>
              <th className="px-4 py-3">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {report.categorySummary.map((c) => (
              <tr key={c.category} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium">{c.category}</td>
                <td className="px-4 py-3">{c.itemCount}</td>
                <td className="px-4 py-3">{c.totalStock.toLocaleString()}</td>
                <td className="px-4 py-3">{formatCurrency(c.totalValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Item Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  No inventory items yet.
                </td>
              </tr>
            ) : (
              report.rows.map((r) => (
                <tr key={r.itemCode} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{r.itemCode}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-slate-500">{r.category}</td>
                  <td className="px-4 py-3">
                    {r.stock.toLocaleString()}
                    {r.outOfStock && (
                      <Badge tone="danger" className="ml-2">out of stock</Badge>
                    )}
                    {r.lowStock && (
                      <Badge tone="warning" className="ml-2">low</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatCurrency(r.price)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(r.value)}</td>
                  <td className="px-4 py-3 text-slate-500">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
