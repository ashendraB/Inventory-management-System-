import { getAllSettings } from "@/server/system-settings-service";
import { SystemSettingsForm } from "@/components/settings/SystemSettingsForm";

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  const settings = await getAllSettings();

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-500">
          Institute details shown on generated invoices. Leave a field blank to omit it.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <SystemSettingsForm initialValues={settings} />
      </div>
    </div>
  );
}
