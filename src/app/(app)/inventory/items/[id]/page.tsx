import { notFound } from "next/navigation";
import { getInventoryItem, totalStockOf } from "@/server/inventory-service";
import { BarcodeDisplay } from "@/components/inventory/BarcodeDisplay";
import { ItemActions } from "@/components/inventory/ItemActions";
import { Badge, statusTone } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InventoryItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getInventoryItem(id);
  if (!item) notFound();

  const totalStock = totalStockOf(item);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{item.name}</h1>
            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
          </div>
          <p className="text-sm text-slate-500">{item.itemCode}</p>
        </div>
        <ItemActions itemId={item.id} status={item.status} />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Detail label="Category" value={item.category.name} />
            <Detail label="Brand" value={item.brand ?? "—"} />
            <Detail label="Unit" value={item.unit} />
            <Detail label="Minimum Stock" value={item.minStock.toLocaleString()} />
            <Detail label="Price" value={formatCurrency(Number(item.defaultPrice))} />
            <Detail label="Current Stock" value={`${totalStock.toLocaleString()} ${item.unit}(s)`} />
            <Detail label="Supplier" value={item.supplier?.name ?? "—"} />
            <Detail label="Location" value={item.location ?? "—"} />
            <Detail label="Added" value={formatDate(item.createdAt)} />
          </dl>
          {item.description && (
            <div>
              <p className="text-xs font-medium text-slate-500">Description</p>
              <p className="text-sm text-slate-700">{item.description}</p>
            </div>
          )}
          {item.notes && (
            <div>
              <p className="text-xs font-medium text-slate-500">Notes</p>
              <p className="text-sm text-slate-700">{item.notes}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <BarcodeDisplay value={item.barcode} label="Item barcode" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Stock Lots</h2>
        {item.lots.length === 0 ? (
          <p className="text-sm text-slate-400">
            No stock lots yet. Stock/Lots management arrives in the next build phase.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="py-2">Lot</th>
                <th className="py-2">Quantity</th>
                <th className="py-2">Cost/Sheet</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {item.lots.map((lot) => (
                <tr key={lot.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">{lot.lotCode}</td>
                  <td className="py-2">{lot.currentQuantity.toLocaleString()}</td>
                  <td className="py-2">{formatCurrency(Number(lot.costPerSheet))}</td>
                  <td className="py-2">
                    <Badge tone={statusTone(lot.status)}>{lot.status}</Badge>
                  </td>
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
