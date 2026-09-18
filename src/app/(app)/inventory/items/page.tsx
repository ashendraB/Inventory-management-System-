import Link from "next/link";
import { listInventoryItems, listCategories } from "@/server/inventory-service";
import { ItemsFilterBar } from "@/components/inventory/ItemsFilterBar";
import { ItemRowActions } from "@/components/inventory/ItemRowActions";
import { Pagination } from "@/components/ui/Pagination";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InventoryItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [result, categories] = await Promise.all([
    listInventoryItems({
      search: sp.search,
      categoryId: sp.categoryId,
      status: sp.status as "ACTIVE" | "INACTIVE" | undefined,
      sort: sp.sort as "name" | "price" | "date" | undefined,
      page: sp.page ? Number(sp.page) : undefined,
    }),
    listCategories(),
  ]);

  function pageHref(page: number) {
    const params = new URLSearchParams(sp as Record<string, string>);
    params.set("page", String(page));
    return `/inventory/items?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Inventory Items</h1>
          <p className="text-sm text-slate-500">
            {result.total} item{result.total === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/inventory/items/new"
          className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
        >
          + Add Inventory Item
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <ItemsFilterBar categories={categories} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Item Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3" title="Whether this item is listed in the catalog — separate from stock level">
                Listing
              </th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                  No inventory items match these filters yet.
                </td>
              </tr>
            ) : (
              result.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/inventory/items/${item.id}`}
                      className="font-medium text-brand-800 hover:underline"
                    >
                      {item.itemCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.category.name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                  <td className="px-4 py-3">
                    {item.totalStock.toLocaleString()}
                    {item.totalStock === 0 && (
                      <Badge tone="danger" className="ml-2">
                        out of stock
                      </Badge>
                    )}
                    {item.totalStock > 0 && item.totalStock <= item.minStock && (
                      <Badge tone="warning" className="ml-2">
                        low
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatCurrency(Number(item.defaultPrice))}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <ItemRowActions itemId={item.id} status={item.status} />
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
