import { listStockTransactions } from "@/server/lot-service";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const TYPE_OPTIONS = [
  "PURCHASE",
  "PRINTING_USAGE",
  "MANUAL_ADJUSTMENT",
  "TRANSFER",
  "RETURN",
  "DAMAGED",
  "STOCK_FINISHED",
];

export default async function StockTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const result = await listStockTransactions({
    type: sp.type,
    page: sp.page ? Number(sp.page) : undefined,
  });

  function pageHref(page: number) {
    const params = new URLSearchParams(sp as Record<string, string>);
    params.set("page", String(page));
    return `/inventory/transactions?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Stock Transactions</h1>
        <p className="text-sm text-slate-500">
          {result.total} transaction{result.total === 1 ? "" : "s"} — a complete audit trail of every stock
          change.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form method="get" className="flex flex-wrap items-center gap-3">
          <select
            name="type"
            defaultValue={sp.type ?? ""}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Filter
          </button>
        </form>
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
            {result.transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No stock transactions yet.
                </td>
              </tr>
            ) : (
              result.transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-500">{formatDate(tx.createdAt)}</td>
                  <td className="px-4 py-3">{tx.type.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">
                    {tx.inventoryItem.itemCode} — {tx.inventoryItem.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{tx.lot?.lotCode ?? "—"}</td>
                  <td
                    className={`px-4 py-3 ${tx.quantityChange < 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {tx.quantityChange > 0 ? "+" : ""}
                    {tx.quantityChange.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{tx.newQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">{tx.user.name}</td>
                  <td className="px-4 py-3 text-slate-500">{tx.reason ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={result.page} totalPages={result.totalPages} makeHref={pageHref} />
    </div>
  );
}
