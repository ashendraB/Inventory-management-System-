import { listGsmTypes } from "@/server/paper-config-service";
import { LookupManager } from "@/components/settings/LookupManager";

export const dynamic = "force-dynamic";

export default async function GsmSettingsPage() {
  const gsmTypes = await listGsmTypes(true);

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">GSM</h1>
        <p className="text-sm text-slate-400">
          Paper weight values used on paper inventory items, printing price rules, and printing
          records.
        </p>
      </div>
      <LookupManager
        apiBase="/api/settings/gsm"
        payloadKey="value"
        inputType="number"
        inputPlaceholder="e.g. 100"
        items={gsmTypes.map((g) => ({ id: g.id, label: String(g.value), isActive: g.isActive }))}
      />
    </div>
  );
}
