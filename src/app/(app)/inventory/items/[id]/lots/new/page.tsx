import { notFound, redirect } from "next/navigation";
import { getInventoryItem, getCategory, listSuppliers } from "@/server/inventory-service";
import { AddStockLotForm } from "@/components/inventory/AddStockLotForm";

export const dynamic = "force-dynamic";

export default async function AddStockLotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, suppliers] = await Promise.all([getInventoryItem(id), listSuppliers()]);
  if (!item) notFound();

  const category = await getCategory(item.categoryId);
  if (category?.name.toLowerCase() !== "paper") {
    redirect(`/inventory/items/${id}`);
  }

  const hasActiveLot = item.lots.some((l) => l.isActiveStock);

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Add Stock Lot</h1>
        <p className="text-sm text-slate-500">
          {item.name} ({item.itemCode})
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <AddStockLotForm itemId={item.id} suppliers={suppliers} hasActiveLot={hasActiveLot} />
      </div>
    </div>
  );
}
