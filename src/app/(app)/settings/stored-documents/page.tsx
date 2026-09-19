import { ClearDocumentsForm } from "@/components/settings/ClearDocumentsForm";

export const dynamic = "force-dynamic";

export default function StoredDocumentsSettingsPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Stored Documents</h1>
        <p className="text-sm text-slate-500">
          Attached PDFs from the Printing Calculator are saved so old jobs can be Reprinted. Not
          every one needs to stay forever — clear old ones here to free up space. This only
          removes the saved file itself; the printing record, its cost, and its place in reports
          and invoices are never touched.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <ClearDocumentsForm />
      </div>
    </div>
  );
}
