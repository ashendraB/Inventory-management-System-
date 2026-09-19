import { listCategories, listSuppliers } from "@/server/inventory-service";
import { listPaperSizes, listGsmTypes, listPaperTypes } from "@/server/paper-config-service";
import { InventoryItemForm } from "@/components/inventory/InventoryItemForm";

export const dynamic = "force-dynamic";

export default async function NewInventoryItemPage({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string }>;
}) {
  const [sp, categories, suppliers, paperSizes, gsmTypes, paperTypes] = await Promise.all([
    searchParams,
    listCategories(),
    listSuppliers(),
    listPaperSizes(),
    listGsmTypes(),
    listPaperTypes(),
  ]);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">Add Inventory Item</h1>
        <p className="text-sm text-slate-400">
          {sp.barcode
            ? "Barcode scanned — fill in the rest of the details and save."
            : "An Item ID and barcode are generated automatically once you save, unless you scan one in."}
        </p>
      </div>
      <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 shadow-sm">
        <InventoryItemForm
          categories={categories}
          suppliers={suppliers}
          paperSizes={paperSizes.map((p) => ({ id: p.id, label: p.name }))}
          gsmTypes={gsmTypes.map((g) => ({ id: g.id, label: String(g.value) }))}
          paperTypes={paperTypes.map((p) => ({ id: p.id, label: p.name }))}
          initialValues={sp.barcode ? { barcode: sp.barcode } : undefined}
        />
      </div>
    </div>
  );
}
