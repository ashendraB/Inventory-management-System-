import { getStoredDocumentsStats, listStoredDocuments } from "@/server/printing-service";
import { getDatabaseSizeStats } from "@/server/db-stats-service";
import { StoredDocumentsFilterBar } from "@/components/settings/StoredDocumentsFilterBar";
import { StoredDocumentRowActions } from "@/components/settings/StoredDocumentRowActions";
import { formatDate, formatBytes } from "@/lib/format";

export const dynamic = "force-dynamic";

function resolveRange(sp: { preset?: string; month?: string }): { from?: Date; to?: Date } {
  if (sp.month) {
    const [year, month] = sp.month.split("-").map(Number);
    return {
      from: new Date(Date.UTC(year, month - 1, 1)),
      to: new Date(Date.UTC(year, month, 1)),
    };
  }
  if (sp.preset === "week") {
    const to = new Date();
    return { from: new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000), to };
  }
  if (sp.preset === "month") {
    const to = new Date();
    return { from: new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000), to };
  }
  return {};
}

export default async function StoredDocumentsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const range = resolveRange(sp);
  const [stats, documents, dbStats] = await Promise.all([
    getStoredDocumentsStats(),
    listStoredDocuments(range),
    getDatabaseSizeStats(),
  ]);
  const dbPercent = Math.min(100, Math.round((dbStats.bytes / dbStats.limitBytes) * 100));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Stored Documents</h1>
          <p className="max-w-2xl text-sm text-slate-500">
            Attached PDFs from the Printing Calculator, saved so old jobs can be Reprinted.
            Deleting one only removes the file itself — the printing record, its cost, and its
            place in reports and invoices are never touched.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-slate-200 border-t-2 border-t-gold-500 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Print Files
            </p>
            <p className="mt-1 text-2xl font-semibold text-brand-800">{formatBytes(stats.bytes)}</p>
            <p className="mt-1 text-xs text-slate-400">
              {stats.count} file{stats.count === 1 ? "" : "s"} stored
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 border-t-2 border-t-gold-500 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Database Total
            </p>
            <p className="mt-1 text-2xl font-semibold text-brand-800">
              {formatBytes(dbStats.bytes)}
            </p>
            <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-800"
                style={{ width: `${dbPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {dbPercent}% of {formatBytes(dbStats.limitBytes)} free-tier limit
            </p>
          </div>
        </div>
      </div>

      <StoredDocumentsFilterBar />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Printing ID</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No stored files match this filter.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-slate-100 last:border-0 transition-colors hover:bg-brand-50/60"
                >
                  <td className="px-4 py-3 font-medium text-brand-800">{doc.printingCode}</td>
                  <td className="px-4 py-3">{doc.documentName}</td>
                  <td className="px-4 py-3 text-slate-500">{doc.lecturerName}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(doc.date)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatBytes(doc.bytes)}</td>
                  <td className="px-4 py-3">
                    <StoredDocumentRowActions recordId={doc.id} documentName={doc.documentName} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
