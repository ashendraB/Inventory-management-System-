import Link from "next/link";
import { listPrintingRecords } from "@/server/printing-service";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PrintingRecordsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const result = await listPrintingRecords({
    search: sp.search,
    page: sp.page ? Number(sp.page) : undefined,
  });

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
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Printing Job
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Printing ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Lecturer</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Paper</th>
              <th className="px-4 py-3">Colour</th>
              <th className="px-4 py-3">Side</th>
              <th className="px-4 py-3">Sheets</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Operator</th>
            </tr>
          </thead>
          <tbody>
            {result.records.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                  No printing records yet.
                </td>
              </tr>
            ) : (
              result.records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/printing/records/${r.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {r.printingCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(r.date)}</td>
                  <td className="px-4 py-3">{r.lecturer.name}</td>
                  <td className="px-4 py-3">{r.documentName}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.paperSize.name}/{r.gsm.value}/{r.paperType.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.colourMode === "BW" ? "B&W" : "Colour"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.sides === "SINGLE" ? "Single" : "Double"}</td>
                  <td className="px-4 py-3">{r.physicalSheets.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(Number(r.totalCost))}</td>
                  <td className="px-4 py-3 text-slate-500">{r.operator.name}</td>
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
