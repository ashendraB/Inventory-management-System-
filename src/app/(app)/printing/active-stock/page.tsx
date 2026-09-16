import { listPaperItemsForCalculator } from "@/server/printing-service";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ActivePaperStockPage() {
  const items = await listPaperItemsForCalculator();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Active Paper Stock</h1>
        <p className="text-sm text-slate-500">
          The lot the printing calculator will use right now for each paper item.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Paper</th>
              <th className="px-4 py-3">Size / GSM / Type</th>
              <th className="px-4 py-3">Active Lot</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Cost / Sheet</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No paper items yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium">{item.name}</span>{" "}
                    <span className="text-slate-400">({item.itemCode})</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.paperSizeName ?? "—"} / {item.gsmValue ?? "—"} / {item.paperTypeName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {item.activeLot ? (
                      item.activeLot.lotCode
                    ) : (
                      <Badge tone="danger">no active stock</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.activeLot ? item.activeLot.currentQuantity.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.activeLot ? formatCurrency(Number(item.activeLot.costPerSheet)) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
