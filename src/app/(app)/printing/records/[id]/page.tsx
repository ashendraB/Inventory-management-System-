import { notFound } from "next/navigation";
import Link from "next/link";
import { getPrintingRecord } from "@/server/printing-service";
import { PrintingRecordActions } from "@/components/printing/PrintingRecordActions";
import { ReprintButton } from "@/components/printing/ReprintButton";
import { EditPrintingRecordForm } from "@/components/printing/EditPrintingRecordForm";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PrintingRecordDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const record = await getPrintingRecord(id);
  if (!record) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gold-400">Printing Summary</h1>
          <p className="text-sm text-slate-400">{record.printingCode}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/printing/records/${record.id}?edit=1`}
            className="inline-flex items-center rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-gold-500/50 hover:bg-white/10"
          >
            Edit
          </Link>
          {record.documentFileName && (
            <ReprintButton
              recordId={record.id}
              className="inline-flex items-center rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-gold-500/50 hover:bg-white/10"
            />
          )}
          <PrintingRecordActions recordId={record.id} />
        </div>
      </div>

      <div className="rounded-xl border border-brand-700 bg-brand-800 p-6 shadow-sm">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Detail label="Lecturer" value={record.lecturer.name} />
          <Detail label="Date" value={formatDate(record.date)} />
          <Detail label="Document" value={record.documentName} />
          <Detail
            label="Paper"
            value={`${record.paperSize.name} / ${record.gsm.value} GSM / ${record.paperType.name}`}
          />
          <Detail label="Printing" value={record.colourMode === "BW" ? "Black & White" : "Colour"} />
          <Detail label="Sides" value={record.sides === "SINGLE" ? "Single" : "Double"} />
          <Detail label="Layout" value={record.layout === "BOOKLET" ? "Booklet" : "Normal"} />
          <Detail label="Pages" value={String(record.pages)} />
          <Detail label="Copies" value={String(record.copies)} />
          {record.subject && <Detail label="Subject" value={record.subject.name} />}
          {record.grade && <Detail label="Grade" value={record.grade.name} />}
          {record.course && <Detail label="Course" value={record.course} />}
          {record.batchClass && <Detail label="Batch/Class" value={record.batchClass} />}
          <Detail label="Operator" value={record.operator.name} />
        </dl>

        <div className="my-4 border-t border-dashed border-white/20" />

        <dl className="space-y-2 text-sm">
          <Row label="Physical Sheets" value={record.physicalSheets.toLocaleString()} />
          {record.wastedSheets > 0 && (
            <Row
              label="Wasted Sheets"
              value={`${record.wastedSheets.toLocaleString()} (not billed)`}
            />
          )}
          <Row
            label={
              <Link href={`/inventory/lots/${record.lotId}`} className="text-gold-400 hover:underline">
                Stock Lot Used
              </Link>
            }
            value={record.lot.lotCode}
          />
          <Row label="Paper Cost" value={formatCurrency(Number(record.totalPaperCost))} />
          <Row label="Printing Charge" value={formatCurrency(Number(record.totalPrintingCharge))} />
          <div className="border-t border-white/10 pt-2">
            <Row label="TOTAL" value={formatCurrency(Number(record.totalCost))} bold />
          </div>
        </dl>

        {record.notes && (
          <div className="mt-4">
            <p className="text-xs font-medium text-slate-400">Notes</p>
            <p className="text-sm text-slate-200">{record.notes}</p>
          </div>
        )}

        <div className="mt-4">
          <EditPrintingRecordForm
            recordId={record.id}
            initialValues={{ wastedSheets: record.wastedSheets, notes: record.notes ?? "" }}
            defaultOpen={sp.edit === "1"}
          />
        </div>
      </div>

      <Link
        href="/printing/calculator"
        className="inline-block rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-brand-900 transition-all duration-150 hover:bg-gold-600 hover:shadow-md active:scale-[0.97]"
      >
        + New Printing Job
      </Link>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="text-slate-100">{value}</dd>
    </div>
  );
}

function Row({ label, value, bold }: { label: React.ReactNode; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className={bold ? "text-base font-semibold text-white" : "text-slate-100"}>{value}</dd>
    </div>
  );
}
