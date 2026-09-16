import Link from "next/link";
import { listLots } from "@/server/lot-service";
import { listInventoryItems } from "@/server/inventory-service";
import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";
import { LotsFilterBar } from "@/components/inventory/LotsFilterBar";
import { LotRowActions } from "@/components/inventory/LotRowActions";
import { Pagination } from "@/components/ui/Pagination";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { LotStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function StockLotsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [result, itemsResult] = await Promise.all([
    listLots({
      itemId: sp.itemId,
      status: sp.status as LotStatus | undefined,
      search: sp.search,
      page: sp.page ? Number(sp.page) : undefined,
    }),
    listInventoryItems({ categoryId: undefined, pageSize: 500 }),
  ]);

  // Only pass plain serializable fields to the Client Component below —
  // the full item objects carry Prisma Decimal fields, which React can't
  // send across the server/client boundary.
  const paperItems = itemsResult.items
    .filter((i) => i.category.name.toLowerCase() === "paper")
    .map((i) => ({ id: i.id, name: i.name, itemCode: i.itemCode }));

  function pageHref(page: number) {
    const params = new URLSearchParams(sp as Record<string, string>);
    params.set("page", String(page));
    return `/inventory/lots?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Stock / Lots</h1>
        <p className="text-sm text-slate-500">
          {result.total} lot{result.total === 1 ? "" : "s"}
        </p>
      </div>

      <BarcodeScanner />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <LotsFilterBar items={paperItems} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Lot Code</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Cost/Sheet</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Purchased</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.lots.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  No stock lots match these filters yet.
                </td>
              </tr>
            ) : (
              result.lots.map((lot) => (
                <tr key={lot.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/inventory/lots/${lot.id}`} className="font-medium text-indigo-600 hover:underline">
                      {lot.lotCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {lot.inventoryItem.itemCode} — {lot.inventoryItem.name}
                  </td>
                  <td className="px-4 py-3">{lot.currentQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500">{formatCurrency(Number(lot.costPerSheet))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lot.status} />
                  </td>
                  <td className="px-4 py-3">{lot.isActiveStock && <Badge tone="success">Active</Badge>}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(lot.purchaseDate)}</td>
                  <td className="px-4 py-3">
                    <LotRowActions lotId={lot.id} status={lot.status} isActiveStock={lot.isActiveStock} />
                  </td>
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
