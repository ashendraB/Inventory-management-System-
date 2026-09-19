import Link from "next/link";
import { listPrintingRecords } from "@/server/printing-service";
import { listActiveLecturers } from "@/server/lecturer-service";
import { listSubjects } from "@/server/paper-config-service";
import { Pagination } from "@/components/ui/Pagination";
import { PrintingRecordRowActions } from "@/components/printing/PrintingRecordRowActions";
import { PrintingRecordsFilterBar } from "@/components/printing/PrintingRecordsFilterBar";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PrintingRecordsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const [result, lecturers, subjects] = await Promise.all([
    listPrintingRecords({
      lecturerId: sp.lecturerId,
      subjectId: sp.subjectId,
      dateFrom: sp.from ? new Date(sp.from) : undefined,
      dateTo: sp.to ? new Date(new Date(sp.to).getTime() + 24 * 60 * 60 * 1000) : undefined,
      search: sp.search,
      page: sp.page ? Number(sp.page) : undefined,
    }),
    listActiveLecturers(),
    listSubjects(),
  ]);

  function pageHref(page: number) {
    const params = new URLSearchParams(sp as Record<string, string>);
    params.set("page", String(page));
    return `/printing/records?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Printing Records</h1>
          <p className="text-sm text-slate-500">
            {result.total} job{result.total === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/printing/calculator"
          className="rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-900 hover:shadow-md active:scale-[0.97]"
        >
          + New Printing Job
        </Link>
      </div>

      <PrintingRecordsFilterBar
        lecturers={lecturers.map((l) => ({ id: l.id, name: l.name }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Printing ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Paper</th>
              <th className="px-4 py-3">Colour</th>
              <th className="px-4 py-3">Side</th>
              <th className="px-4 py-3">Sheets</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Operator</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.records.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-slate-400">
                  No printing records yet.
                </td>
              </tr>
            ) : (
              result.records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 transition-colors hover:bg-brand-50/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/printing/records/${r.id}`}
                      className="font-medium text-brand-800 hover:underline"
                    >
                      {r.printingCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(r.date)}</td>
                  <td className="px-4 py-3">{r.lecturer.name}</td>
                  <td className="px-4 py-3 text-slate-500">{r.subject?.name ?? "—"}</td>
                  <td className="px-4 py-3">{r.documentName}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.paperSize.name}/{r.gsm.value}/{r.paperType.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.colourMode === "BW" ? "B&W" : "Colour"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.sides === "SINGLE" ? "Single" : "Double"}</td>
                  <td className="px-4 py-3">
                    {r.physicalSheets.toLocaleString()}
                    {r.wastedSheets > 0 && (
                      <Badge tone="warning" className="ml-2">
                        +{r.wastedSheets} wasted
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(Number(r.totalCost))}</td>
                  <td className="px-4 py-3 text-slate-500">{r.operator.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Link
                        href={`/printing/records/${r.id}?edit=1`}
                        className="text-brand-800 hover:underline"
                      >
                        Edit
                      </Link>
                      <PrintingRecordRowActions
                        recordId={r.id}
                        hasDocument={Boolean(r.documentFileName)}
                      />
                    </div>
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
