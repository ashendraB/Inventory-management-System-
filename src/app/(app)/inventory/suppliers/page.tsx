import { listSuppliers } from "@/server/inventory-service";
import { SupplierManager } from "@/components/inventory/SupplierManager";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await listSuppliers(true);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Suppliers</h1>
        <p className="text-sm text-slate-500">{suppliers.length} supplier(s)</p>
      </div>
      <SupplierManager suppliers={suppliers} />
    </div>
  );
}
