import { listPaperTypes } from "@/server/paper-config-service";
import { LookupManager } from "@/components/settings/LookupManager";

export const dynamic = "force-dynamic";

export default async function PaperTypesSettingsPage() {
  const paperTypes = await listPaperTypes(true);

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">Paper Types</h1>
        <p className="text-sm text-slate-400">
          Used on paper inventory items, printing price rules, and printing records.
        </p>
      </div>
      <LookupManager
        apiBase="/api/settings/paper-types"
        payloadKey="name"
        inputPlaceholder="e.g. Matte"
        items={paperTypes.map((p) => ({ id: p.id, label: p.name, isActive: p.isActive }))}
      />
    </div>
  );
}
