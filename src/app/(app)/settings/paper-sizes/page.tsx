import { listPaperSizes } from "@/server/paper-config-service";
import { LookupManager } from "@/components/settings/LookupManager";

export const dynamic = "force-dynamic";

export default async function PaperSizesSettingsPage() {
  const paperSizes = await listPaperSizes(true);

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">Paper Sizes</h1>
        <p className="text-sm text-slate-400">
          Used on paper inventory items, printing price rules, and printing records. Deactivating
          one hides it from new selections without touching existing records.
        </p>
      </div>
      <LookupManager
        apiBase="/api/settings/paper-sizes"
        payloadKey="name"
        inputPlaceholder="e.g. A5"
        items={paperSizes.map((p) => ({ id: p.id, label: p.name, isActive: p.isActive }))}
      />
    </div>
  );
}
