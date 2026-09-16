import { notFound } from "next/navigation";
import Link from "next/link";
import { getLot } from "@/server/lot-service";
import { BarcodeDisplay } from "@/components/inventory/BarcodeDisplay";
import { LotRowActions } from "@/components/inventory/LotRowActions";
import { AdjustStockForm } from "@/components/inventory/AdjustStockForm";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lot = await getLot(id);
  if (!lot) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{lot.lotCode}</h1>
            <StatusBadge status={lot.status} />
            {lot.isActiveStock && <Badge tone="success">Active Stock</Badge>}
          </div>
          <Link
            href={`/inventory/items/${lot.inventoryItemId}`}
            className="text-sm text-indigo-600 hover:underline"
          >
            {lot.inventoryItem.name} ({lot.inventoryItem.itemCode})
          </Link>
        </div>
        <LotRowActions lotId={lot.id} status={lot.status} isActiveStock={lot.isActiveStock} />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Detail label="Quantity Purchased" value={lot.quantityPurchased.toLocaleString()} />
            <Detail label="Current Quantity" value={lot.currentQuantity.toLocaleString()} />
            <Detail label="Cost per Sheet" value={formatCurrency(Number(lot.costPerSheet))} />
            <Detail label="Supplier" value={lot.supplier?.name ?? "—"} />
            <Detail label="Location" value={lot.location ?? "—"} />
            <Detail label="Purchase Date" value={formatDate(lot.purchaseDate)} />
          </dl>
          {lot.notes && (
            <div>
              <p className="text-xs font-medium text-slate-500">Notes</p>
              <p className="text-sm text-slate-700">{lot.notes}</p>
            </div>
          )}
          <AdjustStockForm lotId={lot.id} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <BarcodeDisplay value={lot.barcode} label="Lot barcode" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Transaction History</h2>
        {lot.stockTransactions.length === 0 ? (
          <p className="text-sm text-slate-400">No transactions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="py-2">Date</th>
                <th className="py-2">Type</th>
                <th className="py-2">Change</th>
                <th className="py-2">New Quantity</th>
                <th className="py-2">User</th>
                <th className="py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {lot.stockTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-500">{formatDate(tx.createdAt)}</td>
                  <td className="py-2">{tx.type.replaceAll("_", " ")}</td>
                  <td className={`py-2 ${tx.quantityChange < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {tx.quantityChange > 0 ? "+" : ""}
                    {tx.quantityChange.toLocaleString()}
                  </td>
                  <td className="py-2">{tx.newQuantity.toLocaleString()}</td>
                  <td className="py-2 text-slate-500">{tx.user.name}</td>
                  <td className="py-2 text-slate-500">{tx.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}
