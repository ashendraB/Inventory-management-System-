import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getInventoryItem, listCategories, listSuppliers } from "@/server/inventory-service";
import { listPaperSizes, listGsmTypes, listPaperTypes } from "@/server/paper-config-service";
import { InventoryItemForm } from "@/components/inventory/InventoryItemForm";

export const dynamic = "force-dynamic";

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  // Editing is Administrator-only; middleware doesn't know about this
  // specific dynamic route, so enforce it here too.
  if (session?.role !== "ADMINISTRATOR") redirect(`/inventory/items/${id}`);

  const [item, categories, suppliers, paperSizes, gsmTypes, paperTypes] = await Promise.all([
    getInventoryItem(id),
    listCategories(),
    listSuppliers(),
    listPaperSizes(),
    listGsmTypes(),
    listPaperTypes(),
  ]);
  if (!item) notFound();

  const isPaperItem = item.category.name.toLowerCase() === "paper";

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Edit {item.name}</h1>
        <p className="text-sm text-slate-500">{item.itemCode}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <InventoryItemForm
          itemId={item.id}
          isPaperItem={isPaperItem}
          categories={categories}
          suppliers={suppliers.some((s) => s.id === item.supplierId) || !item.supplierId
            ? suppliers
            : [...suppliers, { id: item.supplierId!, name: "(inactive supplier)" }]}
          paperSizes={paperSizes.map((p) => ({ id: p.id, label: p.name }))}
          gsmTypes={gsmTypes.map((g) => ({ id: g.id, label: String(g.value) }))}
          paperTypes={paperTypes.map((p) => ({ id: p.id, label: p.name }))}
          allowNewCategory
          initialValues={{
            name: item.name,
            categoryId: item.categoryId,
            description: item.description ?? "",
            brand: item.brand ?? "",
            minStock: String(item.minStock),
            defaultPrice: String(item.defaultPrice),
            currentQuantity: String(item.currentQuantity),
            supplierId: item.supplierId ?? "",
            location: item.location ?? "",
            notes: item.notes ?? "",
            paperSizeId: item.paperSizeId ?? "",
            gsmId: item.gsmId ?? "",
            paperTypeId: item.paperTypeId ?? "",
          }}
        />
      </div>
    </div>
  );
}
