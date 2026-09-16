import { getSession } from "@/lib/auth";
import { listCategories, listSuppliers } from "@/server/inventory-service";
import { InventoryItemForm } from "@/components/inventory/InventoryItemForm";

export const dynamic = "force-dynamic";

export default async function NewInventoryItemPage() {
  const [session, categories, suppliers] = await Promise.all([
    getSession(),
    listCategories(),
    listSuppliers(),
  ]);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Add Inventory Item</h1>
        <p className="text-sm text-slate-500">
          An Item ID and barcode are generated automatically once you save.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <InventoryItemForm
          categories={categories}
          suppliers={suppliers}
          allowNewCategory={session?.role === "ADMINISTRATOR"}
        />
      </div>
    </div>
  );
}
