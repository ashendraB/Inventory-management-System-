import { notFound } from "next/navigation";
import Link from "next/link";
import { getInventoryItem, totalStockOf } from "@/server/inventory-service";
import { BarcodeDisplay } from "@/components/inventory/BarcodeDisplay";
import { ItemActions } from "@/components/inventory/ItemActions";
import { LotRowActions } from "@/components/inventory/LotRowActions";
import { AdjustItemStockForm } from "@/components/inventory/AdjustItemStockForm";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InventoryItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adjust?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const item = await getInventoryItem(id);
  if (!item) notFound();

  const totalStock = totalStockOf(item);
  const isPaper = item.category.name.toLowerCase() === "paper";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{item.name}</h1>
            <span
              className="flex items-center gap-1"
              title="Whether this item is listed in the catalog — separate from stock level"
            >
              <span className="text-xs text-slate-400">Listing:</span>
              <StatusBadge status={item.status} />
            </span>
          </div>
          <p className="text-sm text-slate-500">{item.itemCode}</p>
        </div>
        <ItemActions itemId={item.id} status={item.status} />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Detail label="Category" value={item.category.name} />
            {isPaper && (
              <>
                <Detail label="Paper Size" value={item.paperSize?.name ?? "—"} />
                <Detail label="GSM" value={item.gsm ? String(item.gsm.value) : "—"} />
                <Detail label="Paper Type" value={item.paperType?.name ?? "—"} />
              </>
            )}
            <Detail label="Brand" value={item.brand ?? "—"} />
            <Detail label="Unit" value={item.unit} />
            <Detail label="Minimum Stock" value={item.minStock.toLocaleString()} />
            <Detail label="Price" value={formatCurrency(Number(item.defaultPrice))} />
            <div>
              <dt className="text-xs font-medium text-slate-500">Current Stock</dt>
              <dd className="flex items-center gap-2 text-slate-800">
                {totalStock.toLocaleString()} {item.unit}(s)
                {totalStock === 0 && <Badge tone="danger">out of stock</Badge>}
                {totalStock > 0 && totalStock <= item.minStock && (
                  <Badge tone="warning">low</Badge>
                )}
              </dd>
            </div>
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
          {!isPaper && (
            <AdjustItemStockForm itemId={item.id} defaultOpen={sp.adjust === "1"} />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <BarcodeDisplay value={item.barcode} label="Item barcode" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Stock Lots</h2>
          {isPaper && (
            <Link
              href={`/inventory/items/${item.id}/lots/new`}
              className="text-sm font-medium text-brand-800 hover:underline"
            >
              + Add Stock Lot
            </Link>
          )}
        </div>
        {item.lots.length === 0 ? (
          <p className="text-sm text-slate-400">
            {isPaper
              ? "No stock lots yet. Add one to give this item a paper cost."
              : "This item isn't paper, so it doesn't use stock lots — its Count field tracks quantity directly."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
                <th className="py-2">Lot</th>
                <th className="py-2">Quantity</th>
                <th className="py-2">Cost/Sheet</th>
                <th className="py-2">Status</th>
                <th className="py-2">Active</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {item.lots.map((lot) => (
                <tr key={lot.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">
                    <Link href={`/inventory/lots/${lot.id}`} className="text-brand-800 hover:underline">
                      {lot.lotCode}
                    </Link>
                  </td>
                  <td className="py-2">{lot.currentQuantity.toLocaleString()}</td>
                  <td className="py-2">{formatCurrency(Number(lot.costPerSheet))}</td>
                  <td className="py-2">
                    <StatusBadge status={lot.status} />
                  </td>
                  <td className="py-2">{lot.isActiveStock && <Badge tone="success">Active</Badge>}</td>
                  <td className="py-2">
                    <LotRowActions lotId={lot.id} status={lot.status} isActiveStock={lot.isActiveStock} />
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
