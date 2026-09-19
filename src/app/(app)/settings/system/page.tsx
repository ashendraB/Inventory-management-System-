import { getAllSettings } from "@/server/system-settings-service";
import { SystemSettingsForm } from "@/components/settings/SystemSettingsForm";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  const settings = await getAllSettings();

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gold-400">System Settings</h1>
        <p className="text-sm text-slate-400">
          Institute details shown on generated invoices. Leave a field blank to omit it.
        </p>
      </div>
      <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 shadow-sm">
        <SystemSettingsForm initialValues={settings} />
      </div>
    </div>
  );
}
