import { listAuditLogs, listAuditActions, listAuditEntityTypes } from "@/server/audit-service";
import { AuditLogFilterBar } from "@/components/reports/AuditLogFilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [result, actions, entityTypes] = await Promise.all([
    listAuditLogs({
      action: sp.action,
      entityType: sp.entityType,
      search: sp.search,
      page: sp.page ? Number(sp.page) : undefined,
    }),
    listAuditActions(),
    listAuditEntityTypes(),
  ]);

  function pageHref(page: number) {
    const params = new URLSearchParams(sp as Record<string, string>);
    params.set("page", String(page));
    return `/reports/audit-log?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
          <p className="text-sm text-slate-500">{result.total} entr{result.total === 1 ? "y" : "ies"}</p>
        </div>
        <a
          href={`/api/reports/audit-log/export?${new URLSearchParams(sp as Record<string, string>).toString()}`}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Download CSV
        </a>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <AuditLogFilterBar actions={actions} entityTypes={entityTypes} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {result.logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No audit log entries match these filters yet.
                </td>
              </tr>
            ) : (
              result.logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">{log.user?.name ?? "system"}</td>
                  <td className="px-4 py-3 font-medium">{log.action}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {log.entityType ?? "—"}
                    {log.entityId && (
                      <span className="text-slate-400"> ({log.entityId.slice(0, 10)}...)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(log.oldValue || log.newValue) && (
                      <details>
                        <summary className="cursor-pointer text-brand-800 hover:underline">
                          View
                        </summary>
                        <div className="mt-2 max-w-md space-y-1">
                          {log.oldValue && (
                            <pre className="overflow-x-auto rounded bg-red-50 p-2 text-xs text-red-800">
                              {log.oldValue}
                            </pre>
                          )}
                          {log.newValue && (
                            <pre className="overflow-x-auto rounded bg-emerald-50 p-2 text-xs text-emerald-800">
                              {log.newValue}
                            </pre>
                          )}
                        </div>
                      </details>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={result.page} totalPages={result.totalPages} makeHref={pageHref} />
    </div>
  );
}
